import type { GameState } from '@/lib/api/games';
import { colorName } from '@/lib/chess/board';

const DRAW_REASONS = {
  threefold_repetition: 'by threefold repetition',
  insufficient_material: 'by insufficient material',
  fifty_move_rule: 'by the fifty-move rule',
  agreement: 'by agreement'
} as const;

/**
 * Derived from `status`, never from `drawReason`: a stalemate is scored `1/2-1/2` but reports
 * a null `drawReason`, so keying off the reason would miss it entirely.
 */
export function describeOutcome(game: GameState): string {
  const winner = game.result === '1-0' ? 'White' : game.result === '0-1' ? 'Black' : null;

  switch (game.status) {
    case 'checkmate':
      return `${winner ?? colorName(game.turn)} wins by checkmate`;
    case 'resigned':
      return `${winner ?? colorName(game.turn)} wins by resignation`;
    case 'stalemate':
      return 'Draw by stalemate';
    case 'draw':
      return `Draw ${game.drawReason ? DRAW_REASONS[game.drawReason] : 'agreed'}`;
    default:
      return 'Game in progress';
  }
}
