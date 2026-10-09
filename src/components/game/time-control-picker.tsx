'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TimeControl } from '@/lib/api/games';
import {
  describeClock,
  describeTimeControl,
  describeTimeControlLong,
  isTimeControlInRange,
  timeControlId,
  TIME_CONTROL_CATEGORIES,
  TIME_CONTROL_LIMITS,
  TIME_CONTROL_PRESETS
} from '@/lib/chess/clock';
import { useId, useState } from 'react';

const CUSTOM = 'custom';

const CATEGORY_LABELS: Record<(typeof TIME_CONTROL_CATEGORIES)[number], string> = { bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid' };

type TimeControlPickerProps = { onChange: (value: TimeControl | null) => void; onValidityChange: (isValid: boolean) => void };

/** Held as strings so a field the user has cleared stays cleared instead of snapping back to zero. */
type CustomFields = { hours: string; minutes: string; seconds: string; increment: string };

const CUSTOM_DEFAULTS: CustomFields = { hours: '0', minutes: '5', seconds: '0', increment: '3' };

/**
 * Only used for the spinner arrows and as the shape of a tidy value. Validity is never judged
 * per field — the real bound is the total, and a field showing red while the button stayed
 * enabled was the two disagreeing.
 */
const FIELD_LIMITS = { hours: { min: 0, max: 3 }, minutes: { min: 0, max: 59 }, seconds: { min: 0, max: 59 }, increment: TIME_CONTROL_LIMITS.incrementSeconds } as const;

/** `isIncrement` decides which bound a field is judged against, so only the faulty one goes red. */
const CUSTOM_FIELDS = [
  { field: 'hours', label: 'Hours', isIncrement: false },
  { field: 'minutes', label: 'Minutes', isIncrement: false },
  { field: 'seconds', label: 'Seconds', isIncrement: false },
  { field: 'increment', label: 'Increment (s)', isIncrement: true }
] as const satisfies readonly { field: keyof CustomFields; label: string; isIncrement: boolean }[];

function parseField(raw: string): number | null {
  const value = Number(raw);

  return raw !== '' && Number.isInteger(value) && value >= 0 ? value : null;
}

/** The initial time is the three fields together — no one of them is wrong on its own. */
function initialSecondsOf(fields: CustomFields): number | null {
  const hours = parseField(fields.hours);
  const minutes = parseField(fields.minutes);
  const seconds = parseField(fields.seconds);

  return hours === null || minutes === null || seconds === null ? null : hours * 3600 + minutes * 60 + seconds;
}

function toTimeControl(fields: CustomFields): TimeControl | null {
  const initialSeconds = initialSecondsOf(fields);
  const incrementSeconds = parseField(fields.increment);

  if (initialSeconds === null || incrementSeconds === null) {
    return null;
  }

  const candidate = { initialSeconds, incrementSeconds };

  return isTimeControlInRange(candidate) ? candidate : null;
}

function withinLimit(value: number | null, { min, max }: { min: number; max: number }): boolean {
  return value !== null && value >= min && value <= max;
}

/**
 * Carries overflow up a unit, so "90" in minutes becomes 1h 30m rather than being refused. The
 * total it represents was always legal; only the way it was written needed tidying.
 */
function normalise(fields: CustomFields): CustomFields {
  const timeControl = toTimeControl(fields);

  if (!timeControl) {
    return fields;
  }

  const { initialSeconds } = timeControl;

  return {
    hours: String(Math.floor(initialSeconds / 3600)),
    minutes: String(Math.floor((initialSeconds % 3600) / 60)),
    seconds: String(initialSeconds % 60),
    increment: fields.increment
  };
}

/**
 * The selection is owned here rather than driven by a `value` prop, because it cannot be derived
 * from one: a custom 5:00+3 and the 5+3 preset produce an identical `TimeControl`, so the chosen
 * row is genuinely extra state. The parent hears about it through `onChange`.
 */
export function TimeControlPicker({ onChange, onValidityChange }: TimeControlPickerProps) {
  const [selection, setSelection] = useState<string>(timeControlId(null));
  const [custom, setCustom] = useState<CustomFields>(CUSTOM_DEFAULTS);
  const hintId = useId();

  const customTimeControl = toTimeControl(custom);
  const initialInvalid = !withinLimit(initialSecondsOf(custom), TIME_CONTROL_LIMITS.initialSeconds);
  const incrementInvalid = !withinLimit(parseField(custom.increment), TIME_CONTROL_LIMITS.incrementSeconds);

  const selectPreset = (id: string, timeControl: TimeControl | null) => {
    setSelection(id);
    onChange(timeControl);
    onValidityChange(true);
  };

  const editCustom = (field: keyof CustomFields, raw: string) => {
    const next = { ...custom, [field]: raw };
    setCustom(next);

    const candidate = toTimeControl(next);

    onChange(candidate);
    onValidityChange(candidate !== null);
  };

  // Tidying mid-keystroke would fight the typist, so overflow is carried only once they leave.
  const normaliseCustom = () => setCustom(normalise);

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        value={selection}
        onValueChange={next => {
          const id = String(next);

          if (id === CUSTOM) {
            setSelection(CUSTOM);
            onChange(customTimeControl);
            onValidityChange(customTimeControl !== null);
            return;
          }

          const preset = TIME_CONTROL_CATEGORIES.flatMap(category => TIME_CONTROL_PRESETS[category]).find(option => timeControlId(option) === id) ?? null;
          selectPreset(id, preset);
        }}
        render={<fieldset />}
        className="gap-4"
      >
        <legend className="text-sm font-medium">Time control</legend>

        <Option id={timeControlId(null)} label="Untimed" description="No clock" />

        {TIME_CONTROL_CATEGORIES.map(category => (
          <div key={category} className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{CATEGORY_LABELS[category]}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIME_CONTROL_PRESETS[category].map(option => (
                <Option key={timeControlId(option)} id={timeControlId(option)} label={describeTimeControl(option)} description={describeTimeControlLong(option)} />
              ))}
            </div>
          </div>
        ))}

        <Option id={CUSTOM} label="Custom" description="Choose your own time and increment" />
      </RadioGroup>

      {selection === CUSTOM && (
        <fieldset className="flex flex-col gap-3 pl-6">
          <legend className="sr-only">Custom time control</legend>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_FIELDS.map(({ field, label, isIncrement }) => (
              <CustomField
                key={field}
                label={label}
                limits={FIELD_LIMITS[field]}
                value={custom[field]}
                hintId={hintId}
                isInvalid={isIncrement ? incrementInvalid : initialInvalid}
                onChange={raw => editCustom(field, raw)}
                onBlur={normaliseCustom}
              />
            ))}
          </div>
          <p id={hintId} className="text-xs text-muted-foreground">
            Between {describeClock(TIME_CONTROL_LIMITS.initialSeconds.min * 1000)} and {describeClock(TIME_CONTROL_LIMITS.initialSeconds.max * 1000)} in total, plus up to{' '}
            {describeClock(TIME_CONTROL_LIMITS.incrementSeconds.max * 1000)} added after each move.
          </p>
        </fieldset>
      )}
    </div>
  );
}

/**
 * The whole row is the label, so the hit target is the option rather than the dot beside it — and
 * for the same reason the focus ring is lifted onto the row. Left on the radio itself it lands on a
 * four-pixel dot, which is easy to tab past without noticing you ever entered the group.
 */
function Option({ id, label, description }: { id: string; label: string; description: string }) {
  return (
    <Label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/40">
      <RadioGroupItem value={id} className="focus-visible:ring-0 focus-visible:border-transparent" />
      <span>{label}</span>
      <span className="sr-only">, {description}</span>
    </Label>
  );
}

type CustomFieldProps = {
  label: string;
  limits: { min: number; max: number };
  value: string;
  hintId: string;
  isInvalid: boolean;
  onChange: (raw: string) => void;
  onBlur: () => void;
};

/**
 * `isInvalid` comes from the total rather than from `limits`, which only drive the spinner arrows.
 * A field judging itself would call 90 minutes wrong while the form happily accepted it.
 */
function CustomField({ label, limits, value, hintId, isInvalid, onChange, onBlur }: CustomFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={limits.min}
        max={limits.max}
        value={value}
        aria-describedby={hintId}
        aria-invalid={isInvalid}
        onChange={event => onChange(event.target.value)}
        onBlur={onBlur}
        className="w-20"
      />
    </div>
  );
}
