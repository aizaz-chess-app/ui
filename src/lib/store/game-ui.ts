import type { Square } from '@/lib/api/games';
import { create } from 'zustand';

export const BoardOrientation = { WHITE: 'white', BLACK: 'black' } as const;
export type BoardOrientation = (typeof BoardOrientation)[keyof typeof BoardOrientation];

/**
 * Moves and clock warnings are announced on separate channels because they land on separate live
 * regions. Sharing one string meant a milestone crossing within a tick of a move overwrote it, and
 * a polite region replaced before it is read simply drops what it was going to say.
 */
type GameUiState = {
  selectedSquare: Square | null;
  focusedSquare: Square;
  orientation: BoardOrientation;
  announcement: string;
  clockAnnouncement: string;
  selectSquare: (square: Square | null) => void;
  focusSquare: (square: Square) => void;
  flipOrientation: () => void;
  announce: (message: string) => void;
  announceClock: (message: string) => void;
  reset: () => void;
};

const initialState = { selectedSquare: null, focusedSquare: 'e1', orientation: BoardOrientation.WHITE, announcement: '', clockAnnouncement: '' } satisfies Pick<
  GameUiState,
  'selectedSquare' | 'focusedSquare' | 'orientation' | 'announcement' | 'clockAnnouncement'
>;

export const useGameUiStore = create<GameUiState>(set => ({
  ...initialState,
  selectSquare: selectedSquare => set({ selectedSquare }),
  focusSquare: focusedSquare => set({ focusedSquare }),
  flipOrientation: () => set(state => ({ orientation: state.orientation === BoardOrientation.WHITE ? BoardOrientation.BLACK : BoardOrientation.WHITE })),
  announce: announcement => set({ announcement }),
  announceClock: clockAnnouncement => set({ clockAnnouncement }),
  reset: () => set(initialState)
}));
