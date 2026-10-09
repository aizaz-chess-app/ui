import { apiRequest } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';

export type GameState = components['schemas']['GameStateDto'];
export type Move = components['schemas']['MoveDto'];
export type MakeMoveBody = components['schemas']['MakeMoveDto'];
export type CreateGameBody = components['schemas']['CreateGameDto'];
export type TimeControl = components['schemas']['TimeControlDto'];
export type Clock = components['schemas']['ClockDto'];
export type Square = components['schemas']['Square'];
export type PlayerColor = components['schemas']['PlayerColor'];
export type GameStatus = components['schemas']['GameStatus'];
export type GameResult = components['schemas']['GameResult'];
export type DrawReason = components['schemas']['DrawReason'];
export type PieceType = components['schemas']['PieceType'];
export type PromotionPiece = components['schemas']['PromotionPiece'];

export function createGame(body?: CreateGameBody): Promise<GameState> {
  return apiRequest<GameState>('/games', { method: 'POST', ...(body && { body: JSON.stringify(body) }) });
}

export function getGame(id: string): Promise<GameState> {
  return apiRequest<GameState>(`/games/${id}`);
}

export function makeMove(id: string, body: MakeMoveBody): Promise<GameState> {
  return apiRequest<GameState>(`/games/${id}/moves`, { method: 'POST', body: JSON.stringify(body) });
}

export function resign(id: string, color: PlayerColor): Promise<GameState> {
  return apiRequest<GameState>(`/games/${id}/resign`, { method: 'POST', body: JSON.stringify({ color }) });
}

export function agreeDraw(id: string): Promise<GameState> {
  return apiRequest<GameState>(`/games/${id}/draw`, { method: 'POST' });
}

export function isGameOver(game: GameState): boolean {
  return game.status !== 'in_progress';
}
