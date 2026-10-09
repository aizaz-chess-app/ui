import { GameClocks } from '@/components/game/game-clocks';
import { gameKeys } from '@/lib/query/games';
import { useGameUiStore } from '@/lib/store/game-ui';
import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gameFixture, timedGameFixture } from '../../fixtures/game';
import { renderWithQuery } from '../../utils/render';

const clocks = () => screen.getAllByRole('timer').map(node => node.getAttribute('aria-label'));

beforeEach(() => useGameUiStore.getState().reset());

describe('GameClocks', () => {
  it('renders both sides from the server payload', () => {
    renderWithQuery(<GameClocks game={timedGameFixture({}, { initialSeconds: 300, incrementSeconds: 0 })} />);

    expect(clocks()).toHaveLength(2);
    expect(clocks().every(label => label?.includes('5 minutes'))).toBe(true);
  });

  // A 1+0 game used to open already flagged as low, so the warning carried no information.
  it('does not open a short game in the low-time state', () => {
    renderWithQuery(<GameClocks game={timedGameFixture({}, { initialSeconds: 60, incrementSeconds: 0 })} />);

    expect(clocks().some(label => label?.includes('low on time'))).toBe(false);
  });

  it('warns at the tightest step that fits inside a short game', () => {
    vi.useFakeTimers();

    try {
      // 40s start: the 60s step does not fit, so the warning belongs at 30s.
      renderWithQuery(<GameClocks game={timedGameFixture({ turn: 'w' }, { initialSeconds: 40, incrementSeconds: 0 })} />);

      act(() => void vi.advanceTimersByTime(5_000));
      expect(clocks().some(label => label?.includes('low on time'))).toBe(false);

      act(() => void vi.advanceTimersByTime(6_000));
      expect(clocks().some(label => label?.includes('low on time'))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * A rematch seeds the query cache before navigating, so this component is never unmounted
   * between games and its dedup set survives. Keyed without the game id, every threshold the
   * previous game used would stay silent for the rest of the session.
   */
  it('announces a threshold again in the next game, having kept the component mounted', () => {
    vi.useFakeTimers();

    try {
      const timeControl = { initialSeconds: 40, incrementSeconds: 0 };
      const { rerender } = renderWithQuery(<GameClocks game={timedGameFixture({ id: 'game-1', turn: 'w' }, timeControl)} />);

      // 40s start warns at 30s, so eleven seconds in is the first threshold crossed.
      act(() => void vi.advanceTimersByTime(11_000));
      const firstGame = useGameUiStore.getState().clockAnnouncement;
      expect(firstGame).not.toBe('');

      useGameUiStore.getState().announceClock('');
      rerender(<GameClocks game={timedGameFixture({ id: 'game-2', turn: 'w' }, timeControl)} />);
      act(() => void vi.advanceTimersByTime(11_000));

      expect(useGameUiStore.getState().clockAnnouncement).toBe(firstGame);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders nothing for an untimed game', () => {
    renderWithQuery(<GameClocks game={gameFixture()} />);

    expect(screen.queryAllByRole('timer')).toHaveLength(0);
  });

  it('orders the clocks to match a flipped board', () => {
    const game = timedGameFixture();
    const { rerender } = renderWithQuery(<GameClocks game={game} />);

    const whiteAtBottom = clocks();
    act(() => useGameUiStore.getState().flipOrientation());
    rerender(<GameClocks game={game} />);

    expect(clocks()).toEqual([...whiteAtBottom].reverse());
  });

  it('counts the side to move down and leaves the idle side alone', () => {
    vi.useFakeTimers();

    try {
      renderWithQuery(<GameClocks game={timedGameFixture({ turn: 'w' }, { initialSeconds: 300, incrementSeconds: 0 })} />);

      act(() => void vi.advanceTimersByTime(10_000));

      const [black, white] = clocks();
      expect(white).toContain('4 minutes 50 seconds');
      expect(black).toContain('5 minutes');
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds a finished game at the values it ended on', () => {
    vi.useFakeTimers();

    try {
      const game = timedGameFixture({ status: 'timeout', result: '0-1' }, { initialSeconds: 300, incrementSeconds: 0 });
      renderWithQuery(<GameClocks game={game} />);

      const before = clocks();
      act(() => void vi.advanceTimersByTime(30_000));

      expect(clocks()).toEqual(before);
    } finally {
      vi.useRealTimers();
    }
  });

  // Running out locally is only a prompt to re-read: the backend decides whether it is a timeout.
  it('refetches once when the moving side runs out, rather than ending the game itself', () => {
    vi.useFakeTimers();

    try {
      const game = timedGameFixture({ turn: 'w' }, { initialSeconds: 1, incrementSeconds: 0 });
      const { queryClient } = renderWithQuery(<GameClocks game={game} />);
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

      act(() => void vi.advanceTimersByTime(5_000));

      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: gameKeys.detail(game.id) });
      expect(game.status).toBe('in_progress');
    } finally {
      vi.useRealTimers();
    }
  });
});
