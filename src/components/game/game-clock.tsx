'use client';

import type { PlayerColor } from '@/lib/api/games';
import { colorName } from '@/lib/chess/board';
import { describeClock, formatClock } from '@/lib/chess/clock';
import { cn } from '@/lib/utils';

type GameClockProps = { color: PlayerColor; ms: number; isActive: boolean; isGameOver: boolean; lowTimeMs: number };

/**
 * `role="timer"` is implicitly `aria-live="off"`, which is the point: at ten updates a second this
 * would otherwise talk over everything else. The figure is readable on demand, and the thresholds
 * worth interrupting for are spoken by `useClockAnnouncements` instead.
 */
export function GameClock({ color, ms, isActive, isGameOver, lowTimeMs }: GameClockProps) {
  const isLow = !isGameOver && ms <= lowTimeMs;

  return (
    <div
      role="timer"
      aria-label={`${colorName(color)} clock, ${describeClock(ms)}${isLow ? ' remaining, low on time' : ''}`}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors',
        isActive ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/50',
        isLow && 'border-destructive bg-destructive/10'
      )}
    >
      <span className={cn('text-sm font-medium', !isActive && 'text-muted-foreground')}>{colorName(color)}</span>
      <span aria-hidden className={cn('text-2xl font-semibold tabular-nums', isLow && 'text-destructive')}>
        {formatClock(ms)}
      </span>
    </div>
  );
}
