import { describe, expect, it } from 'bun:test';
import { Duration } from '../src';

describe('new Duration(components)', () => {
  it('normalizes the components', () => {
    expect({ ...new Duration({ hours: 36 }) }).toEqual({ days: 1, hours: 12, minutes: 0, seconds: 0, milliseconds: 0, '~total': 129_600_000 });
    expect({ ...new Duration({ minutes: 90, milliseconds: 1_500 }) }).toEqual({ days: 0, hours: 1, minutes: 30, seconds: 1, milliseconds: 500, '~total': 5_401_500 });
  });

  it('gives every component the same sign when negative, with no `-0`', () => {
    expect({ ...new Duration({ hours: -36 }) }).toEqual({ days: -1, hours: -12, minutes: 0, seconds: 0, milliseconds: 0, '~total': -129_600_000 });
  });

  it('accepts fractional components', () => {
    expect({ ...new Duration({ hours: 1.5 }) }).toEqual({ days: 0, hours: 1, minutes: 30, seconds: 0, milliseconds: 0, '~total': 5_400_000 });
    expect(new Duration({ hours: 1 / 3 }).minutes).toBe(20);
  });

  it('throws on non-finite components', () => {
    expect(() => new Duration({ days: Infinity })).toThrow(RangeError);
    expect(() => new Duration({ days: NaN })).toThrow(RangeError);
  });

  it('keeps the total in milliseconds as `~total`', () => {
    expect(new Duration({ days: 1, milliseconds: 1 })['~total']).toBe(86_400_001);
  });
});

describe('static constructors', () => {
  it('builds a duration from a single unit', () => {
    expect(Duration.days(2).compare(new Duration({ days: 2 }))).toBe('eq');
    expect(Duration.hours(2).compare(new Duration({ hours: 2 }))).toBe('eq');
    expect(Duration.minutes(2).compare(new Duration({ minutes: 2 }))).toBe('eq');
    expect(Duration.seconds(2).compare(new Duration({ seconds: 2 }))).toBe('eq');
    expect(Duration.milliseconds(2).compare(new Duration({ milliseconds: 2 }))).toBe('eq');
  });
});

describe('arithmetic', () => {
  it('adds and subtracts', () => {
    expect(Duration.hours(20).add(Duration.hours(5)).toISOString()).toBe('P1DT1H');
    expect(Duration.hours(1).sub(Duration.hours(3)).toISOString()).toBe('-PT2H');
  });

  it('diff is `other - this`, so `a.add(a.diff(b))` is `b`', () => {
    const a = Duration.hours(1);
    const b = Duration.hours(3);

    expect(a.diff(b).toISOString()).toBe('PT2H');
    expect(b.diff(a).toISOString()).toBe('-PT2H');
    expect(a.add(a.diff(b)).compare(b)).toBe('eq');
  });
});

describe('comparison', () => {
  it('compares by total length', () => {
    expect(Duration.hours(36).compare(new Duration({ days: 1, hours: 12 }))).toBe('eq');
    expect(Duration.hours(36).compare(Duration.days(2))).toBe('lt');
    expect(Duration.days(2).compare(Duration.hours(36))).toBe('gt');
  });

  it('sorts without mutating the input', () => {
    const values = [Duration.hours(3), Duration.hours(1), Duration.hours(2)];

    expect(Duration.sort(values).map(String)).toEqual(['PT1H', 'PT2H', 'PT3H']);
    expect(values.map(String)).toEqual(['PT3H', 'PT1H', 'PT2H']);
  });

  it('finds min and max', () => {
    const values = [Duration.hours(3), Duration.hours(1), Duration.hours(2)];

    expect(Duration.min(values).toString()).toBe('PT1H');
    expect(Duration.max(values).toString()).toBe('PT3H');
    expect(() => Duration.min([])).toThrow(RangeError);
  });
});

describe('serialization', () => {
  it('formats as an ISO 8601 duration', () => {
    expect(new Duration({}).toISOString()).toBe('PT0S');
    expect(Duration.days(3).toISOString()).toBe('P3D');
    expect(new Duration({ days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 500 }).toISOString()).toBe('P1DT2H3M4.5S');
    expect(Duration.milliseconds(5).toISOString()).toBe('PT0.005S');
    expect(Duration.milliseconds(-1_250).toISOString()).toBe('-PT1.25S');
  });

  it('renders as a string', () => {
    expect(JSON.stringify({ d: Duration.hours(36) })).toBe('{"d":"P1DT12H"}');
    expect(`${Duration.minutes(5)}`).toBe('PT5M');
  });
});
