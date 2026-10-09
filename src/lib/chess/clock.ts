import type { Clock, PlayerColor, TimeControl } from '@/lib/api/games';
import { pad, plural } from '@/lib/utils';

export const TimeControlCategory = { BULLET: 'bullet', BLITZ: 'blitz', RAPID: 'rapid' } as const;
export type TimeControlCategory = (typeof TimeControlCategory)[keyof typeof TimeControlCategory];

/** Render order for the picker; a Record's key order is not something to lean on. */
export const TIME_CONTROL_CATEGORIES: readonly TimeControlCategory[] = [TimeControlCategory.BULLET, TimeControlCategory.BLITZ, TimeControlCategory.RAPID];

const minutes = (initialMinutes: number, incrementSeconds: number): TimeControl => ({ initialSeconds: initialMinutes * 60, incrementSeconds });

export const TIME_CONTROL_PRESETS: Record<TimeControlCategory, readonly TimeControl[]> = {
  [TimeControlCategory.BULLET]: [minutes(1, 0), minutes(1, 1), minutes(2, 1)],
  [TimeControlCategory.BLITZ]: [minutes(3, 0), minutes(3, 2), minutes(5, 0), minutes(5, 3)],
  [TimeControlCategory.RAPID]: [minutes(10, 0), minutes(10, 5), minutes(15, 10), minutes(20, 0), minutes(30, 0), minutes(60, 0)]
};

/**
 * The maximums mirror the `@Max` on the backend's TimeControlDto. The initial minimum does not
 * mirror its `@Min(1)` — a one second game is not worth offering — so this is deliberately the
 * stricter of the two. Anything accepted here the API accepts; the reverse does not hold.
 */
export const TIME_CONTROL_LIMITS = { initialSeconds: { min: 10, max: 10_800 }, incrementSeconds: { min: 0, max: 180 } } as const;

/**
 * The steps a warning can be pitched at, ascending, so the tightest threshold crossed is the one
 * found. Which of them counts as "low" depends on the time control — see `lowTimeMsFor`.
 */
export const URGENCY_MS = [10_000, 30_000, 60_000];

/** Below this the display gains a tenths digit, the usual convention once a flag is close. */
const TENTHS_BELOW_MS = 10_000;

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export type Remaining = { whiteMs: number; blackMs: number };

/** Stable identity for a preset, so the picker can round-trip a radio value without index juggling. */
export function timeControlId(timeControl: TimeControl | null): string {
  return timeControl ? `${timeControl.initialSeconds}+${timeControl.incrementSeconds}` : 'untimed';
}

export function isTimeControlInRange({ initialSeconds, incrementSeconds }: TimeControl): boolean {
  return inRange(initialSeconds, TIME_CONTROL_LIMITS.initialSeconds) && inRange(incrementSeconds, TIME_CONTROL_LIMITS.incrementSeconds);
}

function inRange(value: number, { min, max }: { min: number; max: number }): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Only the side to move burns time, which is what makes a local countdown possible at all:
 * the idle side's figure is already final until the turn changes hands.
 */
export function remainingAt(clock: Clock, turn: PlayerColor, elapsedMs: number): Remaining {
  const burnt = Math.max(0, elapsedMs);

  return { whiteMs: Math.max(0, clock.whiteMs - (turn === 'w' ? burnt : 0)), blackMs: Math.max(0, clock.blackMs - (turn === 'b' ? burnt : 0)) };
}

export function remainingFor(remaining: Remaining, color: PlayerColor): number {
  return color === 'w' ? remaining.whiteMs : remaining.blackMs;
}

/**
 * The widest urgency step that still leaves room to be a warning: strictly below the starting
 * time, so a short game does not open already in the red saying nothing. A one minute game warns
 * at thirty seconds, a thirty second game at ten. Ten is the floor, and at exactly ten seconds the
 * whole game is low — which is the floor working, not an edge to paper over.
 */
export function lowTimeMsFor(timeControl: TimeControl | null): number {
  if (!timeControl) {
    return URGENCY_MS[0];
  }

  const initialMs = timeControl.initialSeconds * MS_PER_SECOND;

  return URGENCY_MS.filter(ms => ms < initialMs).at(-1) ?? URGENCY_MS[0];
}

export function formatClock(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / MS_PER_SECOND);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const mins = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  if (hours > 0) {
    return `${hours}:${pad(mins)}:${pad(seconds)}`;
  }

  if (safe < TENTHS_BELOW_MS) {
    return `${mins}:${pad(seconds)}.${Math.floor((safe % MS_PER_SECOND) / 100)}`;
  }

  return `${mins}:${pad(seconds)}`;
}

/**
 * Spoken form, so a screen reader is not left to interpret "3:07" as a ratio or a date. Carries up
 * to hours: an hour announced as "60 minutes", or five minutes as "300 seconds", is a figure the
 * listener has to convert before it means anything.
 */
export function describeClock(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / MS_PER_SECOND);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const mins = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const parts = [];

  if (hours > 0) {
    parts.push(plural(hours, 'hour'));
  }

  if (mins > 0) {
    parts.push(plural(mins, 'minute'));
  }

  // Zero only reaches here when nothing larger did, and silence is not an answer.
  if (seconds > 0 || parts.length === 0) {
    parts.push(plural(seconds, 'second'));
  }

  return parts.join(' ');
}

/**
 * The "5+3" shorthand.
 * Only whole minutes take the bare number, and the rest say what unit they are in.
 */
export function describeTimeControl(timeControl: TimeControl | null): string {
  if (!timeControl) {
    return 'Untimed';
  }

  const { initialSeconds, incrementSeconds } = timeControl;

  if (initialSeconds % SECONDS_PER_MINUTE === 0) {
    return `${initialSeconds / SECONDS_PER_MINUTE}+${incrementSeconds}`;
  }

  const initial = initialSeconds < SECONDS_PER_MINUTE ? `${initialSeconds}s` : formatClock(initialSeconds * MS_PER_SECOND);

  return `${initial}+${incrementSeconds}`;
}

/** "5+3" is jargon and reads as arithmetic when spoken, so controls carry this instead. */
export function describeTimeControlLong(timeControl: TimeControl | null): string {
  if (!timeControl) {
    return 'Untimed';
  }

  const initial = describeClock(timeControl.initialSeconds * MS_PER_SECOND);

  return timeControl.incrementSeconds === 0 ? initial : `${initial} with ${plural(timeControl.incrementSeconds, 'second')} increment`;
}
