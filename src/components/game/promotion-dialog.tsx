'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PromotionPiece } from '@/lib/api/games';
import { pieceName } from '@/lib/chess/board';

const PROMOTION_CHOICES = ['q', 'r', 'b', 'n'] as const satisfies readonly PromotionPiece[];

type PromotionDialogProps = { open: boolean; onCancel: () => void; onSelect: (piece: PromotionPiece) => void };

export function PromotionDialog({ open, onCancel, onSelect }: PromotionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Promote pawn</DialogTitle>
          <DialogDescription>Choose the piece your pawn becomes.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {PROMOTION_CHOICES.map(piece => (
            <Button key={piece} variant="outline" className="capitalize" onClick={() => onSelect(piece)}>
              {pieceName(piece)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
