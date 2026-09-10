import { GameBoard } from '@/components/game/game-board';
import { useGameUiStore } from '@/lib/store/game-ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gameFixture } from '../../fixtures/game';

function renderBoard(game = gameFixture()) {
  const onMove = vi.fn();
  const onPromotionRequired = vi.fn();

  render(<GameBoard game={game} onMove={onMove} onPromotionRequired={onPromotionRequired} />);

  return { onMove, onPromotionRequired };
}

const square = (name: string) => screen.getByRole('button', { name });

beforeEach(() => useGameUiStore.getState().reset());

describe('GameBoard', () => {
  it('names every square from the position the server sent', () => {
    renderBoard();

    expect(square('e2, white pawn')).toBeInTheDocument();
    expect(square('e8, black king')).toBeInTheDocument();
    expect(square('e4, empty')).toBeInTheDocument();
  });

  it('submits from and to after selecting a piece and a target', async () => {
    const user = userEvent.setup();
    const { onMove } = renderBoard();

    await user.click(square('e2, white pawn'));
    await user.click(square('e4, empty'));

    expect(onMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4' });
  });

  it('submits the same move from the keyboard as from a click', async () => {
    const user = userEvent.setup();
    const { onMove } = renderBoard();

    square('e2, white pawn').focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowUp}{ArrowUp}{Enter}');

    expect(onMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4' });
  });

  it('moves focus with the arrow keys without submitting anything', async () => {
    const user = userEvent.setup();
    const { onMove } = renderBoard();

    square('e2, white pawn').focus();
    await user.keyboard('{ArrowUp}{ArrowRight}');

    expect(square('f3, empty')).toHaveFocus();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('keeps the board a single tab stop', async () => {
    renderBoard();

    const focusable = document.querySelectorAll('[data-square][tabindex="0"]');

    expect(focusable).toHaveLength(1);
  });

  it('leaves no draggable piece in the tab order', () => {
    renderBoard();

    const draggables = [...document.querySelectorAll('[aria-roledescription="draggable"]')];

    expect(draggables.length).toBeGreaterThan(0);
    expect(draggables.every(element => element.getAttribute('tabindex') === '-1')).toBe(true);
    expect(draggables.every(element => element.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('renders only what the server sent, so a rejected move leaves the piece where it was', async () => {
    const user = userEvent.setup();
    const game = gameFixture();
    const { onMove } = renderBoard(game);

    await user.click(square('e2, white pawn'));
    await user.click(square('e5, empty'));

    expect(onMove).toHaveBeenCalled();
    expect(square('e2, white pawn')).toBeInTheDocument();
    expect(square('e5, empty')).toBeInTheDocument();
  });

  it('asks which piece to promote instead of submitting a bare promotion push', async () => {
    const user = userEvent.setup();
    const game = gameFixture({ fen: '8/P6k/8/8/8/8/8/K7 w - - 0 1' });
    const { onMove, onPromotionRequired } = renderBoard(game);

    await user.click(square('a7, white pawn'));
    await user.click(square('a8, empty'));

    expect(onPromotionRequired).toHaveBeenCalledWith({ from: 'a7', to: 'a8' });
    expect(onMove).not.toHaveBeenCalled();
  });

  it('ignores interaction once the game is over', async () => {
    const user = userEvent.setup();
    const { onMove } = renderBoard(gameFixture({ status: 'checkmate', result: '1-0' }));

    await user.click(square('e2, white pawn'));
    await user.click(square('e4, empty'));

    expect(onMove).not.toHaveBeenCalled();
  });
});
