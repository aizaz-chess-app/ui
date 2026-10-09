'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GameState } from '@/lib/api/games';
import { describeTimeControl } from '@/lib/chess/clock';
import { describeOutcome } from '@/lib/chess/outcome';

type GameOverDialogProps = { game: GameState; open: boolean; isStartingNewGame: boolean; onReview: () => void; onRematch: () => void; onChangeTimeControl: () => void };

export function GameOverDialog({ game, open, isStartingNewGame, onReview, onRematch, onChangeTimeControl }: GameOverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onReview()}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center text-3xl tabular-nums">{game.result}</DialogTitle>
          <DialogDescription className="text-center">{describeOutcome(game)}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onRematch} disabled={isStartingNewGame}>
            {isStartingNewGame ? 'Starting…' : `Play again${game.timeControl ? ` (${describeTimeControl(game.timeControl)})` : ''}`}
          </Button>
          <Button variant="outline" onClick={onChangeTimeControl} disabled={isStartingNewGame}>
            Change time control
          </Button>
          <Button variant="ghost" onClick={onReview}>
            Review position (Coming soon)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
