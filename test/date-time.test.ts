import { describe, expect, it } from 'bun:test';
import { Date, DateTime, Duration, Time } from '../src';

describe('DateTime.parse(iso)', () => {
  it('parses an ISO date-time with an offset', () => {
    const dt = DateTime.parse('2024-02-29T13:45:30.5-03:00');

    expect({ ...dt }).toEqual({
      year: 2024,
      month: 2,
      day: 29,
      hour: 13,
      minute: 45,
      second: 30,
      millisecond: 500,
      tzoffset: -180,
      epoch: globalThis.Date.UTC(2024, 1, 29, 16, 45, 30, 500),
    });
  });

  it('parses UTC', () => {
    expect(DateTime.parse('2024-02-29T13:45Z').tzoffset).toBe(0);
    expect(Object.is(DateTime.parse('2024-02-29T13:45-00:00').tzoffset, 0)).toBe(true);
  });

  it('requires an offset', () => {
    expect(() => DateTime.parse('2024-02-29T13:45')).toThrow(RangeError);
  });

  it('throws on malformed or invalid date-times', () => {
    expect(() => DateTime.parse('2024-02-29 13:45Z')).toThrow(RangeError);
    expect(() => DateTime.parse('2023-02-29T13:45Z')).toThrow(RangeError);
    expect(() => DateTime.parse('2024-02-29T24:00Z')).toThrow(RangeError);
    expect(() => DateTime.parse('2024-02-29T13:45+24:00')).toThrow(RangeError);
    expect(() => DateTime.parse('2024-02-29T13:45+03:60')).toThrow(RangeError);
  });
});

describe('DateTime.parse(epoch)', () => {
  it('builds a UTC date-time', () => {
    expect(DateTime.parse(0).toISOString()).toBe('1970-01-01T00:00:00.000Z');
  });

  it('throws on invalid epochs', () => {
    expect(() => DateTime.parse(1.5)).toThrow(RangeError);
    expect(() => DateTime.parse(NaN)).toThrow(RangeError);
    expect(() => DateTime.parse(9e15)).toThrow(RangeError);
  });
});

describe('new DateTime(components)', () => {
  it('defaults time to midnight and offset to UTC', () => {
    expect(new DateTime({ year: 2024, month: 2, day: 29 }).toISOString()).toBe('2024-02-29T00:00:00.000Z');
  });

  it('applies the offset', () => {
    const dt = new DateTime({ year: 2024, month: 1, day: 1, hour: 1, tzoffset: 330 });

    expect(dt.toISOString()).toBe('2024-01-01T01:00:00.000+05:30');
    expect(dt.toNativeDate().toISOString()).toBe('2023-12-31T19:30:00.000Z');
  });

  it('throws on invalid components', () => {
    expect(() => new DateTime({ year: 2024, month: 2, day: 30 })).toThrow(RangeError);
    expect(() => new DateTime({ year: 2024, month: 2, day: 1, hour: 24 })).toThrow(RangeError);
    expect(() => new DateTime({ year: 2024, month: 2, day: 1, tzoffset: 1440 })).toThrow(RangeError);
  });
});

describe('DateTime.nowUTC()', () => {
  it('returns the current instant in UTC', () => {
    const before = globalThis.Date.now();
    const now = DateTime.nowUTC();
    const after = globalThis.Date.now();

    expect(now.tzoffset).toBe(0);
    expect(now.epoch).toBeGreaterThanOrEqual(before);
    expect(now.epoch).toBeLessThanOrEqual(after);
  });
});

describe('arithmetic', () => {
  it('adds and subtracts, keeping the offset', () => {
    const dt = DateTime.parse('2024-02-28T23:00-03:00');

    expect(dt.add(Duration.hours(2)).toISOString()).toBe('2024-02-29T01:00:00.000-03:00');
    expect(dt.sub(Duration.days(1)).toISOString()).toBe('2024-02-27T23:00:00.000-03:00');
  });

  it('diff is `other - this`, so `a.add(a.diff(b))` is `b`, across offsets', () => {
    const a = DateTime.parse('2024-01-01T12:00+02:00');
    const b = DateTime.parse('2024-01-01T12:00Z');

    expect(a.diff(b).toISOString()).toBe('PT2H');
    expect(b.diff(a).toISOString()).toBe('-PT2H');
    expect(a.add(a.diff(b)).compare(b)).toBe('eq');
  });
});

describe('comparison', () => {
  it('compares instants, regardless of offset', () => {
    expect(DateTime.parse('2024-01-01T12:00+02:00').compare(DateTime.parse('2024-01-01T10:00Z'))).toBe('eq');
    expect(DateTime.parse('2024-01-01T12:00+02:00').compare(DateTime.parse('2024-01-01T11:00Z'))).toBe('lt');
    expect(DateTime.parse('2024-01-01T12:00-02:00').compare(DateTime.parse('2024-01-01T13:00Z'))).toBe('gt');
  });

  it('sorts, min and max', () => {
    const values = [
      DateTime.parse('2024-01-01T12:00Z'),
      DateTime.parse('2024-01-01T12:00+02:00'),
      DateTime.parse('2024-01-01T12:00-02:00'),
    ];

    expect(DateTime.sort(values).map(String)).toEqual([
      '2024-01-01T12:00:00.000+02:00',
      '2024-01-01T12:00:00.000Z',
      '2024-01-01T12:00:00.000-02:00',
    ]);
    expect(DateTime.min(values).toString()).toBe('2024-01-01T12:00:00.000+02:00');
    expect(DateTime.max(values).toString()).toBe('2024-01-01T12:00:00.000-02:00');
  });
});

describe('beginningOf / endOf', () => {
  const dt = DateTime.parse('2024-02-14T13:45:30.5-03:00');

  it('returns the first instant of the unit, in its own offset', () => {
    expect(dt.beginningOf('year').toISOString()).toBe('2024-01-01T00:00:00.000-03:00');
    expect(dt.beginningOf('month').toISOString()).toBe('2024-02-01T00:00:00.000-03:00');
    expect(dt.beginningOf('day').toISOString()).toBe('2024-02-14T00:00:00.000-03:00');
  });

  it('returns the last instant of the unit, in its own offset', () => {
    expect(dt.endOf('year').toISOString()).toBe('2024-12-31T23:59:59.999-03:00');
    expect(dt.endOf('month').toISOString()).toBe('2024-02-29T23:59:59.999-03:00');
    expect(dt.endOf('day').toISOString()).toBe('2024-02-14T23:59:59.999-03:00');
  });
});

describe('conversion', () => {
  const dt = DateTime.parse('2024-02-29T23:30-03:00');

  it('extracts the date and time in its own offset', () => {
    expect(dt.date()).toBeInstanceOf(Date);
    expect(dt.date().toISOString()).toBe('2024-02-29');
    expect(dt.time()).toBeInstanceOf(Time);
    expect(dt.time().toISOString()).toBe('23:30:00.000');
  });

  it('converts to a native Date', () => {
    expect(dt.toNativeDate()).toBeInstanceOf(globalThis.Date);
    expect(dt.toNativeDate().toISOString()).toBe('2024-03-01T02:30:00.000Z');
  });

  it('converts to UTC, keeping the instant', () => {
    const utc = dt.utc();

    expect(utc.toISOString()).toBe('2024-03-01T02:30:00.000Z');
    expect(utc.tzoffset).toBe(0);
    expect(utc.epoch).toBe(dt.epoch);
    expect(utc.compare(dt)).toBe('eq');
  });
});

describe('serialization', () => {
  it('renders as a string', () => {
    expect(JSON.stringify({ at: DateTime.parse('2024-02-29T13:45+05:30') })).toBe('{"at":"2024-02-29T13:45:00.000+05:30"}');
    expect(`${DateTime.parse(0)}`).toBe('1970-01-01T00:00:00.000Z');
  });
});
