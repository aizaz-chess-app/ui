'use client';

import { GameView } from '@/components/game/game-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import { useGame } from '@/lib/query/games';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function GamePage({ params }: PageProps<'/game/[id]'>) {
  const { id } = use(params);
  const { data: game, error, isPending } = useGame(id);

  if (isPending) {
    return <GamePageSkeleton />;
  }

  if (error) {
    const isMissing = error instanceof ApiError && error.status === 404;

    return (
      <UnavailableGame
        title={isMissing ? 'This game is no longer available' : 'Could not load this game'}
        description={isMissing ? 'Games are kept only while they are being played, and for a short while after they end.' : 'Check that the backend is running, then try again.'}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6">
      <GameView game={game} />
    </main>
  );
}

function GamePageSkeleton() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-center">
      <Skeleton className="aspect-square w-full max-w-[min(90vw,560px)]" />
      <Skeleton className="h-64 w-full lg:max-w-xs" />
      <span className="sr-only">Loading game</span>
    </main>
  );
}

function UnavailableGame({ title, description }: { title: string; description: string }) {
  const router = useRouter();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Back to the picker rather than straight into a game, so the time control is a choice. */}
          <Button onClick={() => router.push('/')}>New game</Button>
        </CardContent>
      </Card>
    </main>
  );
}
