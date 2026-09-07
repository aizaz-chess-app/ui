import { ApiError, apiRequest } from '@/lib/api/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

function mockResponse(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }));
}

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('returns the parsed body on success', async () => {
    mockResponse(200, { status: 'ok' });

    await expect(apiRequest('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('throws an ApiError carrying the status and the raw body', async () => {
    mockResponse(404, { statusCode: 404, message: 'Not found', error: 'Not Found' });

    const error = await apiRequest('/games/nope').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, body: { statusCode: 404, message: 'Not found', error: 'Not Found' } });
  });
});
