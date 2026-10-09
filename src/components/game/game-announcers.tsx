'use client';

import { useGameUiStore } from '@/lib/store/game-ui';

/**
 * Two regions rather than one, because assistive tech queues each region independently. Sharing a
 * region would let a clock warning land on top of a move announcement within a single tick, and
 * polite text replaced before it is read is simply never spoken.
 *
 * Both are rendered unconditionally, including for untimed games: a live region has to be in the
 * DOM before its content changes, or the change may not be announced at all.
 */
export function MoveAnnouncer() {
  const announcement = useGameUiStore(state => state.announcement);

  return <LiveRegion message={announcement} />;
}

export function ClockAnnouncer() {
  const clockAnnouncement = useGameUiStore(state => state.clockAnnouncement);

  return <LiveRegion message={clockAnnouncement} />;
}

function LiveRegion({ message }: { message: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}
