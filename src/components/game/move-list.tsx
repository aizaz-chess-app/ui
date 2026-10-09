'use client';

import type { Move } from '@/lib/api/games';

export function MoveList({ history }: { history: Move[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No moves yet.</p>;
  }

  const pairs = Array.from({ length: Math.ceil(history.length / 2) }, (_, index) => ({ number: index + 1, white: history[index * 2], black: history[index * 2 + 1] }));

  return (
    <ol aria-label="Moves played" className="max-h-64 overflow-y-auto text-sm tabular-nums">
      {pairs.map(pair => (
        <li key={pair.number} className="flex gap-3 py-0.5">
          <span className="w-6 shrink-0 text-muted-foreground">{pair.number}.</span>
          <span className="w-16">{pair.white.san}</span>
          <span className="w-16">{pair.black?.san ?? ''}</span>
        </li>
      ))}
    </ol>
  );
}
