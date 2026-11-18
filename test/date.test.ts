import { describe, expect, it } from 'bun:test';
import { Date, Duration } from '../src';

describe('Date.parse(iso)', () => {
  it('parses an ISO date', () => {
    expect({ ...Date.parse('2024-02-29') }).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it('throws on malformed or invalid dates', () => {
    expect(() => Date.parse('2024-2-29')).toThrow(RangeError);
    expect(() => Date.parse('2024-02-29T00:00Z')).toThrow(RangeError);
    expect(() => Date.parse('2023-02-29')).toThrow(RangeError);
    expect(() => Date.parse('2024-13-01')).toThrow(RangeError);
    expect(() => Date.parse('2024-00-01')).toThrow(RangeError);
  });
});

describe('new Date(components)', () => {
  it('builds a date', () => {
    expect(new Date({ year: 2024, month: 12, day: 31 }).toISOString()).toBe('2024-12-31');
  });

  it('handles years 0..99 literally', () => {
    expect(new Date({ year: 50, month: 1, day: 1 }).toISOString()).toBe('0050-01-01');
    expect(Date.parse('0050-03-01').sub(Duration.days(1)).toISOString()).toBe('0050-02-28');
  });

  it('throws on invalid components', () => {
    expect(() => new Date({ year: 2024, month: 4, day: 31 })).toThrow(RangeError);
    expect(() => new Date({ year: 2024, month: 1, day: 1.5 })).toThrow(RangeError);
    expect(() => new Date({ year: 10_000, month: 1, day: 1 })).toThrow(RangeError);
  });
});

describe('Date.todayUTC()', () => {
  it('returns the current date in UTC', () => {
    expect(Date.todayUTC().toISOString()).toBe(new globalThis.Date().toISOString().slice(0, 10));
  });
});

describe('arithmetic', () => {
  it('adds and subtracts whole days', () => {
    expect(Date.parse('2024-02-28').add(Duration.days(2)).toISOString()).toBe('2024-03-01');
    expect(Date.parse('2024-01-01').sub(Duration.days(1)).toISOString()).toBe('2023-12-31');
    expect(Date.parse('2024-01-01').add(Duration.hours(48)).toISOString()).toBe('2024-01-03');
  });

  it('throws when the duration is not whole days', () => {
    expect(() => Date.parse('2024-01-01').add(Duration.hours(5))).toThrow(RangeError);
  });

  it('diff is `other - this`, so `a.add(a.diff(b))` is `b`', () => {
    const a = Date.parse('2024-02-01');
    const b = Date.parse('2024-03-01');

    expect(a.diff(b).toISOString()).toBe('P29D');
    expect(b.diff(a).toISOString()).toBe('-P29D');
    expect(a.add(a.diff(b)).compare(b)).toBe('eq');
  });
});

describe('comparison', () => {
  it('compares dates', () => {
    expect(Date.parse('2024-01-01').compare(Date.parse('2024-01-02'))).toBe('lt');
    expect(Date.parse('2024-01-01').compare(Date.parse('2024-01-01'))).toBe('eq');
    expect(Date.parse('2024-01-02').compare(Date.parse('2024-01-01'))).toBe('gt');
  });

  it('sorts, min and max', () => {
    const values = [Date.parse('2024-03-01'), Date.parse('2023-12-31'), Date.parse('2024-01-15')];

    expect(Date.sort(values).map(String)).toEqual(['2023-12-31', '2024-01-15', '2024-03-01']);
    expect(Date.min(values).toString()).toBe('2023-12-31');
    expect(Date.max(values).toString()).toBe('2024-03-01');
  });
});

describe('beginningOf / endOf', () => {
  const date = Date.parse('2024-02-14');

  it('returns the first day of the unit', () => {
    expect(date.beginningOf('year').toISOString()).toBe('2024-01-01');
    expect(date.beginningOf('month').toISOString()).toBe('2024-02-01');
  });

  it('returns the last day of the unit', () => {
    expect(date.endOf('year').toISOString()).toBe('2024-12-31');
    expect(date.endOf('month').toISOString()).toBe('2024-02-29');
    expect(Date.parse('2023-02-14').endOf('month').toISOString()).toBe('2023-02-28');
  });
});

describe('serialization', () => {
  it('renders as a string', () => {
    expect(JSON.stringify({ d: Date.parse('2024-02-29') })).toBe('{"d":"2024-02-29"}');
    expect(`${Date.parse('2024-02-29')}`).toBe('2024-02-29');
  });
});
