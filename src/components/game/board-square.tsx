'use client';

import type { Square } from '@/lib/api/games';
import { describeSquare } from '@/lib/chess/board';
import { cn } from '@/lib/utils';
import type { KeyboardEvent, ReactNode, Ref } from 'react';

type BoardSquareProps = {
  square: Square;
  pieceType: string | undefined;
  isSelected: boolean;
  isFocusTarget: boolean;
  isDisabled: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  ref: Ref<HTMLButtonElement>;
  children: ReactNode;
};

/**
 * react-chessboard hangs `onSquareClick` off a plain div, which is unreachable by keyboard and
 * nameless to a screen reader. This renders a real button inside each square via `squareRenderer`,
 * so the square gets focus and a name. It deliberately has no click handler of its own: activating
 * a button with Enter or Space dispatches a click that bubbles to the library's own handler, so
 * pointer and keyboard both arrive at the single move path.
 */
export function BoardSquare({ square, pieceType, isSelected, isFocusTarget, isDisabled, onKeyDown, ref, children }: BoardSquareProps) {
  return (
    <button
      ref={ref}
      type="button"
      data-square={square}
      // Roving tabindex: the board is one tab stop, and arrow keys move between squares.
      tabIndex={isFocusTarget ? 0 : -1}
      aria-label={describeSquare(square, pieceType)}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      onKeyDown={onKeyDown}
      className={cn(
        'flex size-full cursor-pointer items-center justify-center outline-none',
        'focus-visible:shadow-[inset_0_0_0_4px_#0284c7,inset_0_0_0_7px_rgba(255,255,255,0.95)]',
        isSelected && 'shadow-[inset_0_0_0_4px_var(--color-primary)]',
        isDisabled && 'cursor-default'
      )}
    >
      {children}
    </button>
  );
}
