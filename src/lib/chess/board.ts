import type { PlayerColor, Square } from '@/lib/api/games';
import { BoardOrientation } from '@/lib/store/game-ui';
import { fenStringToPositionObject } from 'react-chessboard';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

const PIECE_NAMES = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' } as const;

const COLOR_NAMES = { w: 'White', b: 'Black' } as const;

export type BoardPosition = Record<string, { pieceType: string }>;

export function positionFromFen(fen: string): BoardPosition {
  return fenStringToPositionObject(fen, RANKS.length, FILES.length);
}

export function colorOf(pieceType: string): PlayerColor | null {
  return pieceType[0] === 'w' || pieceType[0] === 'b' ? (pieceType[0] as PlayerColor) : null;
}

export function colorName(color: PlayerColor): string {
  return COLOR_NAMES[color];
}

export function pieceName(piece: string): string {
  return PIECE_NAMES[piece.toUpperCase() as keyof typeof PIECE_NAMES] ?? piece;
}

export function describePiece(pieceType: string): string {
  const color = colorOf(pieceType);
  const name = PIECE_NAMES[pieceType[1] as keyof typeof PIECE_NAMES];

  return color && name ? `${COLOR_NAMES[color].toLowerCase()} ${name}` : pieceType;
}

export function describeSquare(square: Square, pieceType: string | undefined): string {
  return pieceType ? `${square}, ${describePiece(pieceType)}` : `${square}, empty`;
}

export function isPieceOf(pieceType: string | undefined, color: PlayerColor): boolean {
  return pieceType !== undefined && colorOf(pieceType) === color;
}

/**
 * Geometry, not chess rules: a pawn landing on the far rank must carry a promotion piece or
 * the backend rejects the move as illegal. A false positive on an otherwise illegal move is
 * harmless — the server rejects it either way.
 */
export function isPromotionMove(pieceType: string | undefined, to: Square): boolean {
  if (pieceType === 'wP') {
    return to.endsWith('8');
  }

  return pieceType === 'bP' && to.endsWith('1');
}

export function toSquare(fileIndex: number, rankIndex: number): Square {
  return `${FILES[fileIndex]}${RANKS[rankIndex]}` as Square;
}

export function squareIndices(square: Square): { fileIndex: number; rankIndex: number } {
  return { fileIndex: FILES.indexOf(square[0] as (typeof FILES)[number]), rankIndex: RANKS.indexOf(square[1] as (typeof RANKS)[number]) };
}

const ARROW_STEPS = { ArrowLeft: { file: -1, rank: 0 }, ArrowRight: { file: 1, rank: 0 }, ArrowUp: { file: 0, rank: 1 }, ArrowDown: { file: 0, rank: -1 } } as const;

export type ArrowKey = keyof typeof ARROW_STEPS;

export function isArrowKey(key: string): key is ArrowKey {
  return key in ARROW_STEPS;
}

/** Arrow keys move relative to what the player sees, so a flipped board inverts both axes. */
export function squareInDirection(from: Square, key: ArrowKey, orientation: BoardOrientation): Square {
  const step = ARROW_STEPS[key];
  const sign = orientation === BoardOrientation.WHITE ? 1 : -1;
  const { fileIndex, rankIndex } = squareIndices(from);

  return toSquare(clamp(fileIndex + step.file * sign, FILES.length), clamp(rankIndex + step.rank * sign, RANKS.length));
}

export function squareAtEdge(from: Square, edge: 'Home' | 'End', orientation: BoardOrientation): Square {
  const { rankIndex } = squareIndices(from);
  const leftmost = orientation === BoardOrientation.WHITE ? 0 : FILES.length - 1;

  return toSquare(edge === 'Home' ? leftmost : FILES.length - 1 - leftmost, rankIndex);
}

function clamp(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}
