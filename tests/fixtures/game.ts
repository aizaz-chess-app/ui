import type { GameState, TimeControl } from '@/lib/api/games';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function gameFixture(overrides: Partial<GameState> = {}): GameState {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    fen: START_FEN,
    pgn: '',
    turn: 'w',
    moveNumber: 1,
    inCheck: false,
    status: 'in_progress',
    result: null,
    drawReason: null,
    history: [],
    timeControl: null,
    clock: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

const DEFAULT_TIME_CONTROL: TimeControl = { initialSeconds: 300, incrementSeconds: 3 };

/**
 * `serverTime` defaults to now, so a countdown anchored to it starts from the full clock. Tests
 * that need time to have passed should pass an older `serverTime` rather than wait.
 */
export function timedGameFixture(overrides: Partial<GameState> = {}, timeControl: TimeControl = DEFAULT_TIME_CONTROL): GameState {
  const initialMs = timeControl.initialSeconds * 1000;

  return gameFixture({ timeControl, clock: { whiteMs: initialMs, blackMs: initialMs, serverTime: new Date().toISOString() }, ...overrides });
}
