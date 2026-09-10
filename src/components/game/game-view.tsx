'use client';

import { GameBoard } from '@/components/game/game-board';
import { GameOverDialog } from '@/components/game/game-over-dialog';
import { GamePanel } from '@/components/game/game-panel';
import { MoveAnnouncer } from '@/components/game/move-announcer';
import { PromotionDialog } from '@/components/game/promotion-dialog';
import { isGameOver, type GameState, type PromotionPiece, type Square } from '@/lib/api/games';
import { colorName } from '@/lib/chess/board';
import { describeOutcome } from '@/lib/chess/outcome';
import { useAgreeDraw, useCreateGame, useMakeMove, useResign } from '@/lib/query/games';
import { useGameUiStore } from '@/lib/store/game-ui';
import { useEffect, useState } from 'react';

type PendingPromotion = { from: Square; to: Square };

export function GameView({ game }: { game: GameState }) {
  const makeMove = useMakeMove(game.id);
  const resign = useResign(game.id);
  const agreeDraw = useAgreeDraw(game.id);
  const createGame = useCreateGame();

  const { announce, reset, selectSquare } = useGameUiStore();
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const gameOver = isGameOver(game);
  const isBusy = makeMove.isPending || resign.isPending || agreeDraw.isPending;

  useEffect(() => reset, [reset]);

  useAnnouncedGameState(game);

  useEffect(() => {
    if (makeMove.isError) {
      announce('Illegal move. The piece stays where it was.');
    }
  }, [makeMove.isError, makeMove.failureCount, announce]);

  const submitMove = (move: { from: Square; to: Square; promotion?: PromotionPiece }) => {
    selectSquare(null);
    makeMove.mutate(move);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
      <MoveAnnouncer />
      <GameBoard game={game} onMove={submitMove} onPromotionRequired={setPendingPromotion} />
      <GamePanel game={game} isBusy={isBusy} onResign={() => resign.mutate(game.turn)} onAgreeDraw={() => agreeDraw.mutate()} />

      <PromotionDialog
        open={pendingPromotion !== null}
        onCancel={() => setPendingPromotion(null)}
        onSelect={promotion => {
          if (pendingPromotion) {
            submitMove({ ...pendingPromotion, promotion });
          }
          setPendingPromotion(null);
        }}
      />

      <GameOverDialog
        game={game}
        open={gameOver && !isReviewing}
        isStartingNewGame={createGame.isPending}
        onReview={() => setIsReviewing(true)}
        onNewGame={() => createGame.mutate()}
      />
    </div>
  );
}

/** Moves, check and the final result all reach a screen reader through the live region. */
function useAnnouncedGameState(game: GameState) {
  const announce = useGameUiStore(state => state.announce);

  useEffect(() => {
    if (isGameOver(game)) {
      announce(`${describeOutcome(game)}. Final result ${game.result}.`);
      return;
    }

    const lastMove = game.history.at(-1);

    if (!lastMove) {
      announce('New game. White to move.');
      return;
    }

    const check = game.inCheck ? `${colorName(game.turn)} is in check. ` : '';
    announce(`${colorName(lastMove.color)} played ${lastMove.san}. ${check}${colorName(game.turn)} to move.`);
  }, [game, announce]);
}
