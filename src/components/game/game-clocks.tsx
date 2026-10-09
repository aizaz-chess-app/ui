'use client';

import { GameClock } from '@/components/game/game-clock';
import { useClockAnnouncements, useGameClock } from '@/hooks/use-game-clock';
import { isGameOver, type GameState, type PlayerColor } from '@/lib/api/games';
import { lowTimeMsFor } from '@/lib/chess/clock';
import { BoardOrientation, useGameUiStore } from '@/lib/store/game-ui';

type GameClocksProps = { game: GameState };

/**
 * The countdown lives here rather than in GameView so a tick re-renders two readouts instead of
 * the whole board
 *
 * Ordered to match the board: whoever is at the bottom of the board has their clock at the bottom.
 */
export function GameClocks({ game }: GameClocksProps) {
  const orientation = useGameUiStore(state => state.orientation);
  const remaining = useGameClock(game);
  const gameOver = isGameOver(game);

  useClockAnnouncements(game, remaining);

  if (remaining === null) {
    return null;
  }

  const order: PlayerColor[] = orientation === BoardOrientation.WHITE ? ['b', 'w'] : ['w', 'b'];
  const lowTimeMs = lowTimeMsFor(game.timeControl);

  return (
    <div className="flex flex-col gap-2">
      {order.map(color => (
        <GameClock
          key={color}
          color={color}
          ms={color === 'w' ? remaining.whiteMs : remaining.blackMs}
          isActive={!gameOver && game.turn === color}
          isGameOver={gameOver}
          lowTimeMs={lowTimeMs}
        />
      ))}
    </div>
  );
}
