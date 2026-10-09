'use client';

import { BoardSquare } from '@/components/game/board-square';
import type { GameState, PromotionPiece, Square } from '@/lib/api/games';
import { isGameOver } from '@/lib/api/games';
import { isArrowKey, isPieceOf, isPromotionMove, positionFromFen, squareAtEdge, squareInDirection } from '@/lib/chess/board';
import { useGameUiStore } from '@/lib/store/game-ui';
import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from 'react-chessboard';
import { useShallow } from 'zustand/react/shallow';

type GameBoardProps = {
  game: GameState;
  onMove: (move: { from: Square; to: Square; promotion?: PromotionPiece }) => void;
  onPromotionRequired: (move: { from: Square; to: Square }) => void;
};

export function GameBoard({ game, onMove, onPromotionRequired }: GameBoardProps) {
  const { selectedSquare, focusedSquare, orientation, selectSquare, focusSquare } = useGameUiStore(
    useShallow(state => ({
      selectedSquare: state.selectedSquare,
      focusedSquare: state.focusedSquare,
      orientation: state.orientation,
      selectSquare: state.selectSquare,
      focusSquare: state.focusSquare
    }))
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const squareRefs = useRef(new Map<Square, HTMLButtonElement>());

  const position = useMemo(() => positionFromFen(game.fen), [game.fen]);
  const gameOver = isGameOver(game);

  const submit = useCallback(
    (from: Square, to: Square) => {
      const pieceType = position[from]?.pieceType;

      if (isPromotionMove(pieceType, to)) {
        onPromotionRequired({ from, to });
        return;
      }

      onMove({ from, to });
    },
    [position, onMove, onPromotionRequired]
  );

  const handleSquareClick = useCallback(
    ({ square }: SquareHandlerArgs) => {
      const target = square as Square;

      if (gameOver) {
        return;
      }

      focusSquare(target);

      if (selectedSquare === null) {
        if (isPieceOf(position[target]?.pieceType, game.turn)) {
          selectSquare(target);
        }
        return;
      }

      if (selectedSquare === target) {
        selectSquare(null);
        return;
      }

      // Re-selecting rather than submitting when the target holds another of your own pieces
      // keeps a miss-click from firing a doomed request.
      if (isPieceOf(position[target]?.pieceType, game.turn)) {
        selectSquare(target);
        return;
      }

      selectSquare(null);
      submit(selectedSquare, target);
    },
    [gameOver, focusSquare, selectedSquare, position, game.turn, selectSquare, submit]
  );

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
      if (gameOver || targetSquare === null) {
        return false;
      }

      selectSquare(null);
      submit(sourceSquare as Square, targetSquare as Square);

      // The board is fully controlled by `position`, so returning true would only suppress the
      // entry animation, never move the piece. Without chess.js there is no legal optimistic FEN
      // to render, so the piece snaps back and the server's response re-renders the board.
      return false;
    },
    [gameOver, selectSquare, submit]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const from = event.currentTarget.dataset.square as Square;

      if (isArrowKey(event.key)) {
        event.preventDefault();
        const next = squareInDirection(from, event.key, orientation);
        focusSquare(next);
        squareRefs.current.get(next)?.focus();
        return;
      }

      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const next = squareAtEdge(from, event.key, orientation);
        focusSquare(next);
        squareRefs.current.get(next)?.focus();
        return;
      }

      if (event.key === 'Escape') {
        selectSquare(null);
      }
    },
    [orientation, focusSquare, selectSquare]
  );

  useNeutralisedDraggableFocusStops(boardRef, game.fen);

  return (
    <div ref={boardRef} className="w-full max-w-[min(90vw,560px)]">
      <Chessboard
        options={{
          id: 'game-board',
          position: game.fen,
          boardOrientation: orientation,
          allowDragging: !gameOver,
          allowDrawingArrows: false,
          onSquareClick: handleSquareClick,
          onPieceDrop: handlePieceDrop,
          squareStyles: selectedSquare ? { [selectedSquare]: { backgroundColor: 'color-mix(in oklab, var(--color-primary) 35%, transparent)' } } : {},
          squareRenderer: ({ square, children }) => (
            <BoardSquare
              key={square}
              square={square as Square}
              pieceType={position[square]?.pieceType}
              isSelected={selectedSquare === square}
              isFocusTarget={focusedSquare === square}
              isDisabled={gameOver}
              onKeyDown={handleKeyDown}
              ref={node => {
                if (node) {
                  squareRefs.current.set(square as Square, node);
                } else {
                  squareRefs.current.delete(square as Square);
                }
              }}
            >
              {children}
            </BoardSquare>
          )
        }}
      />
    </div>
  );
}

/**
 * react-chessboard wraps every piece in dnd-kit's `useDraggable`, which unconditionally applies
 * `role="button"`, `tabIndex={0}` and `aria-roledescription="draggable"` — but it registers only
 * mouse and touch sensors, no `KeyboardSensor`. That leaves a focus stop per piece that announces
 * as a draggable button and does nothing. Our square buttons are the real keyboard path, so these
 * are taken out of the tab order and hidden from assistive tech. Pieces remount on every position
 * change, hence the observer as well as the fen dependency.
 */
function useNeutralisedDraggableFocusStops(boardRef: React.RefObject<HTMLDivElement | null>, fen: string) {
  useEffect(() => {
    const root = boardRef.current;

    if (!root) {
      return;
    }

    const neutralise = () => {
      root.querySelectorAll<HTMLElement>('[aria-roledescription="draggable"]').forEach(element => {
        element.tabIndex = -1;
        element.setAttribute('aria-hidden', 'true');
      });
    };

    neutralise();

    const observer = new MutationObserver(neutralise);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [boardRef, fen]);
}
