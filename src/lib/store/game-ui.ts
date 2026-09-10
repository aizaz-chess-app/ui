import type { Square } from '@/lib/api/games';
import { create } from 'zustand';

export const BoardOrientation = { WHITE: 'white', BLACK: 'black' } as const;
export type BoardOrientation = (typeof BoardOrientation)[keyof typeof BoardOrientation];

type GameUiState = {
  selectedSquare: Square | null;
  focusedSquare: Square;
  orientation: BoardOrientation;
  announcement: string;
  selectSquare: (square: Square | null) => void;
  focusSquare: (square: Square) => void;
  flipOrientation: () => void;
  announce: (message: string) => void;
  reset: () => void;
};

const initialState = { selectedSquare: null, focusedSquare: 'e1', orientation: BoardOrientation.WHITE, announcement: '' } satisfies Pick<
  GameUiState,
  'selectedSquare' | 'focusedSquare' | 'orientation' | 'announcement'
>;

export const useGameUiStore = create<GameUiState>(set => ({
  ...initialState,
  selectSquare: selectedSquare => set({ selectedSquare }),
  focusSquare: focusedSquare => set({ focusedSquare }),
  flipOrientation: () => set(state => ({ orientation: state.orientation === BoardOrientation.WHITE ? BoardOrientation.BLACK : BoardOrientation.WHITE })),
  announce: announcement => set({ announcement }),
  reset: () => set(initialState)
}));
