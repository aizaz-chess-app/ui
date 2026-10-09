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
    // A flag only loses if the other side could still mate, so this can score as a draw — and the
    // reason is read off the payload rather than assumed, the same as the `draw` case below.
    case 'timeout':
      return winner ? `${winner} wins on time` : `Draw on time ${game.drawReason ? DRAW_REASONS[game.drawReason] : ''}`.trim();
    case 'stalemate':
      return 'Draw by stalemate';
    case 'draw':
      return `Draw ${game.drawReason ? DRAW_REASONS[game.drawReason] : 'agreed'}`;
    default:
      return 'Game in progress';
  }
}
