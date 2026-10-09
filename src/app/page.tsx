'use client';

import { TimeControlPicker } from '@/components/game/time-control-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimeControl } from '@/lib/api/games';
import { useCreateGame } from '@/lib/query/games';
import { useState } from 'react';

export default function HomePage() {
  const createGame = useCreateGame();
  const [timeControl, setTimeControl] = useState<TimeControl | null>(null);
  const [isValid, setIsValid] = useState(true);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Chess</CardTitle>
          <CardDescription>Two players, one board, taking turns on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <TimeControlPicker onChange={setTimeControl} onValidityChange={setIsValid} />

          <Button size="lg" onClick={() => createGame.mutate(timeControl ? { timeControl } : undefined)} disabled={createGame.isPending || !isValid}>
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
