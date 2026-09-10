import type { GameState } from '@/lib/api/games';

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}
