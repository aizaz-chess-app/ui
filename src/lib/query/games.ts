'use client';

import { agreeDraw, createGame, getGame, makeMove, resign, type CreateGameBody, type GameState, type MakeMoveBody, type PlayerColor } from '@/lib/api/games';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const gameKeys = { all: ['games'] as const, detail: (id: string) => ['games', id] as const };

export function useGame(id: string) {
  return useQuery({ queryKey: gameKeys.detail(id), queryFn: () => getGame(id) });
}

// Every mutating endpoint returns the whole game, so the server's own response is what
// lands in the cache. A rejection invalidates instead, so the board re-reads the server's
// copy rather than whatever the failed call assumed.
function gameMutationHandlers(queryClient: QueryClient, id: string) {
  return { onSuccess: (game: GameState) => queryClient.setQueryData(gameKeys.detail(id), game), onError: () => queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) }) };
}

export function useMakeMove(id: string) {
  const queryClient = useQueryClient();

  return useMutation({ mutationFn: (body: MakeMoveBody) => makeMove(id, body), ...gameMutationHandlers(queryClient, id) });
}

export function useResign(id: string) {
  const queryClient = useQueryClient();

  return useMutation({ mutationFn: (color: PlayerColor) => resign(id, color), ...gameMutationHandlers(queryClient, id) });
}

export function useAgreeDraw(id: string) {
  const queryClient = useQueryClient();

  return useMutation({ mutationFn: () => agreeDraw(id), ...gameMutationHandlers(queryClient, id) });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body?: CreateGameBody) => createGame(body),
    onSuccess: game => {
      queryClient.setQueryData(gameKeys.detail(game.id), game);
      router.push(`/game/${game.id}`);
    }
  });
}
