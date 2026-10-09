import { describeClock, describeTimeControl, formatClock, isTimeControlInRange, lowTimeMsFor, remainingAt, TIME_CONTROL_LIMITS } from '@/lib/chess/clock';
import { describe, expect, it } from 'vitest';

const clock = { whiteMs: 120_000, blackMs: 90_000, serverTime: new Date().toISOString() };

describe('remainingAt', () => {
  it('debits only the side to move', () => {
    expect(remainingAt(clock, 'w', 5_000)).toEqual({ whiteMs: 115_000, blackMs: 90_000 });
    expect(remainingAt(clock, 'b', 5_000)).toEqual({ whiteMs: 120_000, blackMs: 85_000 });
  });

  it('floors at zero rather than going negative', () => {
    expect(remainingAt(clock, 'w', 999_999)).toEqual({ whiteMs: 0, blackMs: 90_000 });
  });
});

describe('formatClock', () => {
  it('gains a tenths digit only under ten seconds', () => {
    expect(formatClock(10_000)).toBe('0:10');
    expect(formatClock(9_900)).toBe('0:09.9');
  });

  it('carries hours once there are any', () => {
    expect(formatClock(3_600_000)).toBe('1:00:00');
  });

  it('never renders a negative clock', () => {
    expect(formatClock(-5_000)).toBe('0:00.0');
  });
});

describe('describeClock', () => {
  // Spoken aloud, "300 seconds" or "60 minutes" makes the listener do the conversion.
  it('speaks each figure in its largest whole unit', () => {
    expect(describeClock(300_000)).toBe('5 minutes');
    expect(describeClock(3_600_000)).toBe('1 hour');
    expect(describeClock(5_400_000)).toBe('1 hour 30 minutes');
    expect(describeClock(10_000)).toBe('10 seconds');
  });

  it('singularises a lone unit', () => {
    expect(describeClock(60_000)).toBe('1 minute');
  });

  it('still answers at zero', () => {
    expect(describeClock(0)).toBe('0 seconds');
  });
});

describe('describeTimeControl', () => {
  it('uses the minutes-plus-increment shorthand for whole minutes', () => {
    expect(describeTimeControl({ initialSeconds: 300, incrementSeconds: 3 })).toBe('5+3');
    expect(describeTimeControl({ initialSeconds: 5400, incrementSeconds: 0 })).toBe('90+0');
  });

  // Dividing by sixty unconditionally rendered a ten second game as "0.16666666666666666+3".
  it('names the unit rather than emitting a fraction of a minute', () => {
    expect(describeTimeControl({ initialSeconds: 10, incrementSeconds: 3 })).toBe('10s+3');
    expect(describeTimeControl({ initialSeconds: 45, incrementSeconds: 0 })).toBe('45s+0');
  });

  it('falls back to a clock figure between the two', () => {
    expect(describeTimeControl({ initialSeconds: 90, incrementSeconds: 2 })).toBe('1:30+2');
  });

  it('names an absent time control', () => {
    expect(describeTimeControl(null)).toBe('Untimed');
  });
});

describe('lowTimeMsFor', () => {
  const at = (initialSeconds: number) => lowTimeMsFor({ initialSeconds, incrementSeconds: 0 });

  it('warns a minute out when the game is long enough for that to mean something', () => {
    expect(at(300)).toBe(60_000);
    expect(at(120)).toBe(60_000);
  });

  // A one minute game that opened already in the red was telling the player nothing.
  it('drops to the next step down when a minute is the whole game', () => {
    expect(at(60)).toBe(30_000);
    expect(at(40)).toBe(30_000);
  });

  it('keeps dropping for shorter games', () => {
    expect(at(30)).toBe(10_000);
    expect(at(15)).toBe(10_000);
  });

  it('floors at the tightest step', () => {
    expect(at(10)).toBe(10_000);
  });
});

describe('isTimeControlInRange', () => {
  const { initialSeconds, incrementSeconds } = TIME_CONTROL_LIMITS;

  it('accepts its own boundaries', () => {
    expect(isTimeControlInRange({ initialSeconds: initialSeconds.min, incrementSeconds: incrementSeconds.min })).toBe(true);
    expect(isTimeControlInRange({ initialSeconds: initialSeconds.max, incrementSeconds: incrementSeconds.max })).toBe(true);
  });

  // The maximums are the backend's. The initial minimum is stricter than its `@Min(1)` on purpose,
  // so this rejects some values the API would have accepted — never the other way round.
  it('rejects anything outside them', () => {
    expect(isTimeControlInRange({ initialSeconds: initialSeconds.min - 1, incrementSeconds: 0 })).toBe(false);
    expect(isTimeControlInRange({ initialSeconds: initialSeconds.max + 1, incrementSeconds: 0 })).toBe(false);
    expect(isTimeControlInRange({ initialSeconds: 300, incrementSeconds: incrementSeconds.max + 1 })).toBe(false);
  });

  it('rejects a fractional value, which is not an integer to the API', () => {
    expect(isTimeControlInRange({ initialSeconds: 300.5, incrementSeconds: 0 })).toBe(false);
  });
});
