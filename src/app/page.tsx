'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateGame } from '@/lib/query/games';

export default function HomePage() {
  const createGame = useCreateGame();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Chess</CardTitle>
          <CardDescription>Two players, one board, taking turns on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button size="lg" onClick={() => createGame.mutate()} disabled={createGame.isPending}>
            {createGame.isPending ? 'Starting…' : 'Play on same device'}
          </Button>
          {createGame.isError && (
            <p role="alert" className="text-sm text-destructive">
              Could not start a game. Check that the backend is running, then try again.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
