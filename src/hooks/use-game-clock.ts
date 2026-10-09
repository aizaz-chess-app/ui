'use client';

import { isGameOver, type GameState, type PlayerColor, type TimeControl } from '@/lib/api/games';
import { colorName } from '@/lib/chess/board';
import { describeClock, lowTimeMsFor, remainingAt, remainingFor, URGENCY_MS, type Remaining } from '@/lib/chess/clock';
import { gameKeys } from '@/lib/query/games';
import { useGameUiStore } from '@/lib/store/game-ui';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

/** Fast enough for the tenths digit the display shows under ten seconds. */
const TICK_MS = 100;

/** Round steps for the progress check-ins. The last is also the ceiling: never coarser than half an hour. */
const CHECK_IN_STEPS_MS = [30, 60, 120, 300, 600, 900, 1800].map(seconds => seconds * 1000);

const COARSEST_STEP_MS = CHECK_IN_STEPS_MS[CHECK_IN_STEPS_MS.length - 1];

/** Roughly how much of the game one step should cover, before snapping to a round figure. */
const CHECK_IN_SHARE = 0.2;

/**
 * The step scales with the time control and then stops at half an hour, so a long game keeps
 * reporting for its whole length rather than tailing off. Check-ins never run out — a three hour
 * game is still told at 30m, 1h, 1h30, 2h and 2h30 that it is being slow.
 */
function checkInStepMs(initialMs: number): number {
  return CHECK_IN_STEPS_MS.find(step => step >= initialMs * CHECK_IN_SHARE) ?? COARSEST_STEP_MS;
}

type Milestone = { key: string; text: string };

/**
 * Two modes that never overlap. Above the urgency band a player hears how much of their time has
 * gone; inside it they hear what is left, on thresholds that do not move with the time control.
 * Crossing into urgency abandons any check-in that had come due — at a minute left, how far
 * through the game you are has stopped being the useful fact.
 */
function milestoneFor(timeControl: TimeControl, turn: PlayerColor, remainingMs: number): Milestone | undefined {
  const who = colorName(turn);

  // `lowTimeMsFor` is itself one of URGENCY_MS, so the step found below can never exceed the band:
  // a thirty second game warns at ten seconds and never claims "1 minute left".
  if (remainingMs <= lowTimeMsFor(timeControl)) {
    const threshold = URGENCY_MS.find(ms => remainingMs <= ms);

    return threshold === undefined ? undefined : { key: `urgent:${turn}:${threshold}`, text: `${who}, ${describeClock(threshold)} left.` };
  }

  const initialMs = timeControl.initialSeconds * 1000;
  // Increment can carry a side above where it started, which is not elapsed time in any useful sense.
  const elapsedMs = Math.max(0, initialMs - remainingMs);
  const step = checkInStepMs(initialMs);
  const mark = Math.floor(elapsedMs / step) * step;

  return mark === 0 ? undefined : { key: `elapsed:${turn}:${mark}`, text: `${who}, ${describeClock(mark)} elapsed.` };
}

function frozen(game: GameState): Remaining | null {
  return game.clock ? { whiteMs: game.clock.whiteMs, blackMs: game.clock.blackMs } : null;
}

/**
 * Counts down from the server's clock without ever deciding the game.
 *
 * Elapsed time is measured from a `performance.now()` anchor taken inside the effect that receives
 * a payload, not from `Date.now()` against `serverTime`: a skewed browser clock would otherwise
 * offset every reading. What is left is network latency, which biases us low — we show marginally
 * less time than the server holds, so the flag refetch can never fire early.
 */
export function useGameClock(game: GameState): Remaining | null {
  const queryClient = useQueryClient();
  const { clock, turn, id } = game;
  const gameOver = isGameOver(game);

  // Stamped with the payload it was derived from, so a newly arrived clock discards the old
  // countdown instead of showing it for a frame — no reset needed, and nothing stale can be read.
  const [ticked, setTicked] = useState<{ serverTime: string; value: Remaining } | null>(null);
  const flaggedRef = useRef(false);

  const ticking = clock !== null && !gameOver;

  useEffect(() => {
    // A finished game's clock is already frozen at the values it ended on, so it is read verbatim.
    if (!ticking) {
      return;
    }

    flaggedRef.current = false;
    const anchor = performance.now();

    const timer = setInterval(() => {
      const value = remainingAt(clock, turn, performance.now() - anchor);
      setTicked({ serverTime: clock.serverTime, value });

      // The server only adjudicates a flag when something asks it to, so running out locally is a
      // prompt to re-read, never a result. Whatever comes back is what gets rendered.
      if (!flaggedRef.current && remainingFor(value, turn) === 0) {
        flaggedRef.current = true;
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) });
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [ticking, clock, turn, id, queryClient]);

  // setInterval is throttled in a background tab, so the countdown drifts behind while hidden.
  useEffect(() => {
    if (!ticking) {
      return;
    }

    const resync = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) });
      }
    };

    document.addEventListener('visibilitychange', resync);

    return () => document.removeEventListener('visibilitychange', resync);
  }, [ticking, id, queryClient]);

  // Until the first tick lands, the payload itself is the answer: at the anchor no time has burnt.
  return ticking && ticked?.serverTime === clock.serverTime ? ticked.value : frozen(game);
}

/**
 * A ticking value cannot live in the polite live region without swamping it, so the clock itself
 * is silent and only these thresholds are spoken.
 */
export function useClockAnnouncements(game: GameState, remaining: Remaining | null): void {
  const announceClock = useGameUiStore(state => state.announceClock);
  const announcedRef = useRef(new Set<string>());

  const { id, turn, timeControl } = game;
  const speak = remaining !== null && timeControl !== null && !isGameOver(game);
  const milestone = speak ? milestoneFor(timeControl, turn, remainingFor(remaining, turn)) : undefined;
  // Scoped to the game. A rematch seeds the query cache before navigating, so this component is
  // never unmounted between games; an unscoped key would carry the previous game's announcements
  // over and silence every threshold it had already used.
  const key = milestone && `${id}:${milestone.key}`;
  const text = milestone?.text;

  useEffect(() => {
    if (key === undefined || text === undefined || announcedRef.current.has(key)) {
      return;
    }

    announcedRef.current.add(key);
    announceClock(text);
  }, [key, text, announceClock]);
}
