import { TimeControlPicker } from '@/components/game/time-control-picker';
import { describeTimeControl, TIME_CONTROL_PRESETS } from '@/lib/chess/clock';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

/** Options are found by the shorthand the component itself renders, so re-wording copy cannot break this. */
const byShorthand = (label: string) => screen.getByRole('radio', { name: new RegExp(label.replace('+', '\\+')) });

function setup(overrides: { onChange?: (value: unknown) => void; onValidityChange?: (valid: boolean) => void } = {}) {
  const onChange = overrides.onChange ?? vi.fn();
  const onValidityChange = overrides.onValidityChange ?? vi.fn();

  render(<TimeControlPicker onChange={onChange} onValidityChange={onValidityChange} />);

  return { user: userEvent.setup(), onChange, onValidityChange };
}

describe('TimeControlPicker', () => {
  it('reports a chosen preset as the payload the API expects', async () => {
    const { user, onChange } = setup();
    const preset = TIME_CONTROL_PRESETS.blitz[1];

    await user.click(byShorthand(describeTimeControl(preset)));

    expect(onChange).toHaveBeenLastCalledWith(preset);
  });

  it('reports untimed as no time control at all', async () => {
    const { user, onChange } = setup();

    await user.click(byShorthand(describeTimeControl(TIME_CONTROL_PRESETS.rapid[0])));
    await user.click(byShorthand(describeTimeControl(null)));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  /** DOM order, so the assertions stay off the field labels: hours, minutes, seconds, increment. */
  const customFields = () => screen.getAllByRole('spinbutton');

  const openCustom = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('radio', { name: /custom/i }));

    return customFields();
  };

  const set = async (user: ReturnType<typeof userEvent.setup>, field: HTMLElement, next: string) => {
    await user.clear(field);
    await user.type(field, next);
  };

  it('adds the hours, minutes and seconds fields into one initial time', async () => {
    const { user, onChange, onValidityChange } = setup();
    const [hours, minutes, seconds, increment] = await openCustom(user);

    await set(user, hours, '1');
    await set(user, minutes, '30');
    await set(user, seconds, '15');
    await set(user, increment, '2');

    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(onChange).toHaveBeenLastCalledWith({ initialSeconds: 3600 + 1800 + 15, incrementSeconds: 2 });
  });

  it('rejects a total under the ten second floor even though each field is in range', async () => {
    const { user, onChange, onValidityChange } = setup();
    const [hours, minutes, seconds] = await openCustom(user);

    await set(user, hours, '0');
    await set(user, minutes, '0');
    await set(user, seconds, '5');

    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('rejects a total over what the backend accepts', async () => {
    const { user, onChange, onValidityChange } = setup();
    const [hours, minutes] = await openCustom(user);

    await set(user, hours, '3');
    await set(user, minutes, '30');

    expect(Number(hours.getAttribute('max'))).toBeGreaterThanOrEqual(3);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
