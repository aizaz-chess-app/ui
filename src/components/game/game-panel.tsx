'use client';

import { MoveList } from '@/components/game/move-list';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { GameState } from '@/lib/api/games';
import { isGameOver } from '@/lib/api/games';
import { colorName } from '@/lib/chess/board';
import { describeOutcome } from '@/lib/chess/outcome';
import { useGameUiStore } from '@/lib/store/game-ui';
import type { ReactElement } from 'react';

type GamePanelProps = { game: GameState; isBusy: boolean; onResign: () => void; onAgreeDraw: () => void };

export function GamePanel({ game, isBusy, onResign, onAgreeDraw }: GamePanelProps) {
  const { orientation, flipOrientation } = useGameUiStore();
  const gameOver = isGameOver(game);

  return (
    <Card className="w-full lg:max-w-xs">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{gameOver ? describeOutcome(game) : `${colorName(game.turn)} to move`}</span>
          {game.inCheck && !gameOver && <Badge variant="destructive">Check</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <MoveList history={game.history} />
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={flipOrientation}>
            Flip board
            <span className="sr-only">, currently {orientation} at the bottom</span>
          </Button>
          {!gameOver && (
            <>
              <ConfirmAction
                trigger={
                  <Button variant="outline" size="sm" disabled={isBusy}>
                    Resign
                  </Button>
                }
                title={`${colorName(game.turn)} resigns?`}
                description={`This ends the game immediately and awards the win to ${colorName(game.turn === 'w' ? 'b' : 'w')}.`}
                confirmLabel="Resign"
                onConfirm={onResign}
              />
              <ConfirmAction
                trigger={
                  <Button variant="outline" size="sm" disabled={isBusy}>
                    Agree to draw
                  </Button>
                }
                title="Agree to a draw?"
                description="This ends the game immediately as a draw."
                confirmLabel="Agree to draw"
                onConfirm={onAgreeDraw}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type ConfirmActionProps = { trigger: ReactElement; title: string; description: string; confirmLabel: string; onConfirm: () => void };

/** Both endings are irreversible and there is no undo, so each one asks first. */
function ConfirmAction({ trigger, title, description, confirmLabel, onConfirm }: ConfirmActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
