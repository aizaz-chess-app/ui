import { ApiError } from '@/lib/api/client';
import { agreeDraw, createGame, getGame, isGameOver, makeMove, resign } from '@/lib/api/games';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gameFixture, timedGameFixture } from '../../fixtures/game';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof mockFetch>) {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];

  return { url, method: init.method, body: init.body ? JSON.parse(init.body as string) : undefined };
}

afterEach(() => vi.unstubAllGlobals());

describe('games api', () => {
  it('creates a game with no request body', async () => {
    const fetchMock = mockFetch(201, gameFixture());

    await createGame();

    expect(lastCall(fetchMock)).toMatchObject({ url: expect.stringContaining('/games'), method: 'POST', body: undefined });
  });

  it('creates a timed game by sending the time control', async () => {
    const timeControl = { initialSeconds: 300, incrementSeconds: 3 };
    const fetchMock = mockFetch(201, timedGameFixture({}, timeControl));

    await createGame({ timeControl });

    expect(lastCall(fetchMock)).toMatchObject({ method: 'POST', body: { timeControl } });
  });

  it('reads a game by id', async () => {
    const fetchMock = mockFetch(200, gameFixture());

    await getGame('abc');

    expect(lastCall(fetchMock)).toMatchObject({ url: expect.stringContaining('/games/abc'), method: undefined });
  });

  it('submits a move as from/to rather than notation', async () => {
    const fetchMock = mockFetch(200, gameFixture());

    await makeMove('abc', { from: 'e2', to: 'e4' });

    expect(lastCall(fetchMock)).toMatchObject({ url: expect.stringContaining('/games/abc/moves'), method: 'POST', body: { from: 'e2', to: 'e4' } });
  });

  it('carries the promotion piece when one is chosen', async () => {
    const fetchMock = mockFetch(200, gameFixture());

    await makeMove('abc', { from: 'a7', to: 'a8', promotion: 'q' });

    expect(lastCall(fetchMock).body).toMatchObject({ promotion: 'q' });
  });

  it('resigns for a given colour', async () => {
    const fetchMock = mockFetch(200, gameFixture());

    await resign('abc', 'w');

    expect(lastCall(fetchMock)).toMatchObject({ url: expect.stringContaining('/games/abc/resign'), method: 'POST', body: { color: 'w' } });
  });

  it('agrees a draw with no request body', async () => {
    const fetchMock = mockFetch(200, gameFixture());

    await agreeDraw('abc');

    expect(lastCall(fetchMock)).toMatchObject({ url: expect.stringContaining('/games/abc/draw'), method: 'POST', body: undefined });
  });

  it('surfaces a rejected move as an ApiError carrying the status', async () => {
    mockFetch(400, { statusCode: 400, message: 'Illegal move e2-e5 for the current position', error: 'Bad Request' });

    const error = await makeMove('abc', { from: 'e2', to: 'e5' }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400 });
  });
});

describe('isGameOver', () => {
  it('treats every terminal status as over and only in_progress as live', () => {
    expect(isGameOver(gameFixture({ status: 'in_progress' }))).toBe(false);
    expect(isGameOver(gameFixture({ status: 'checkmate' }))).toBe(true);
    expect(isGameOver(gameFixture({ status: 'stalemate' }))).toBe(true);
    expect(isGameOver(gameFixture({ status: 'draw' }))).toBe(true);
    expect(isGameOver(gameFixture({ status: 'resigned' }))).toBe(true);
    expect(isGameOver(gameFixture({ status: 'timeout' }))).toBe(true);
  });
});
