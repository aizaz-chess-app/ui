'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GameState } from '@/lib/api/games';
import { describeOutcome } from '@/lib/chess/outcome';

type GameOverDialogProps = { game: GameState; open: boolean; isStartingNewGame: boolean; onReview: () => void; onNewGame: () => void };

export function GameOverDialog({ game, open, isStartingNewGame, onReview, onNewGame }: GameOverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onReview()}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center text-3xl tabular-nums">{game.result}</DialogTitle>
          <DialogDescription className="text-center">{describeOutcome(game)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onReview}>
            Review position (Coming soon)
          </Button>
          <Button onClick={onNewGame} disabled={isStartingNewGame}>
            {isStartingNewGame ? 'Starting…' : 'New game'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
