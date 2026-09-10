'use client';

import { useGameUiStore } from '@/lib/store/game-ui';

/** State changes are announced here rather than being left to visual-only feedback. */
export function MoveAnnouncer() {
  const announcement = useGameUiStore(state => state.announcement);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );
}
