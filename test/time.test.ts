import { describe, expect, it } from 'bun:test';
import { Duration, Time } from '../src';

describe('Time.parse(iso)', () => {
  it('parses an ISO time', () => {
    expect({ ...Time.parse('13:45') }).toEqual({ hour: 13, minute: 45, second: 0, millisecond: 0 });
    expect({ ...Time.parse('13:45:30') }).toEqual({ hour: 13, minute: 45, second: 30, millisecond: 0 });
    expect({ ...Time.parse('13:45:30.5') }).toEqual({ hour: 13, minute: 45, second: 30, millisecond: 500 });
    expect({ ...Time.parse('13:45:30.123') }).toEqual({ hour: 13, minute: 45, second: 30, millisecond: 123 });
  });

  it('throws on malformed or invalid times', () => {
    expect(() => Time.parse('1:45')).toThrow(RangeError);
    expect(() => Time.parse('13:45:30.1234')).toThrow(RangeError);
    expect(() => Time.parse('24:00')).toThrow(RangeError);
    expect(() => Time.parse('13:60')).toThrow(RangeError);
    expect(() => Time.parse('13:45Z')).toThrow(RangeError);
  });
});

describe('new Time(components)', () => {
  it('defaults seconds and milliseconds to 0', () => {
    expect(new Time({ hour: 9, minute: 5 }).toISOString()).toBe('09:05:00.000');
  });

  it('throws on invalid components', () => {
    expect(() => new Time({ hour: -1, minute: 0 })).toThrow(RangeError);
    expect(() => new Time({ hour: 0, minute: 0, millisecond: 1_000 })).toThrow(RangeError);
  });
});

describe('arithmetic', () => {
  it('adds and subtracts', () => {
    expect(Time.parse('10:00').add(Duration.minutes(90)).toISOString()).toBe('11:30:00.000');
    expect(Time.parse('10:00').sub(Duration.seconds(1)).toISOString()).toBe('09:59:59.000');
  });

  it('wraps around midnight', () => {
    expect(Time.parse('23:00').add(Duration.hours(2)).toISOString()).toBe('01:00:00.000');
    expect(Time.parse('01:00').sub(Duration.hours(2)).toISOString()).toBe('23:00:00.000');
    expect(Time.parse('10:00').add(Duration.days(3)).toISOString()).toBe('10:00:00.000');
  });

  it('diff is `other - this`, so `a.add(a.diff(b))` is `b`', () => {
    const a = Time.parse('10:30');
    const b = Time.parse('12:00');

    expect(a.diff(b).toISOString()).toBe('PT1H30M');
    expect(b.diff(a).toISOString()).toBe('-PT1H30M');
    expect(a.add(a.diff(b)).compare(b)).toBe('eq');
    expect(b.add(b.diff(a)).compare(a)).toBe('eq');
  });
});

describe('comparison', () => {
  it('compares times', () => {
    expect(Time.parse('10:00').compare(Time.parse('10:00:00.001'))).toBe('lt');
    expect(Time.parse('10:00').compare(Time.parse('10:00:00'))).toBe('eq');
    expect(Time.parse('10:01').compare(Time.parse('10:00'))).toBe('gt');
  });

  it('sorts, min and max', () => {
    const values = [Time.parse('12:00'), Time.parse('08:00'), Time.parse('10:00')];

    expect(Time.sort(values).map(String)).toEqual(['08:00:00.000', '10:00:00.000', '12:00:00.000']);
    expect(Time.min(values).toString()).toBe('08:00:00.000');
    expect(Time.max(values).toString()).toBe('12:00:00.000');
  });
});

describe('serialization', () => {
  it('renders as a string', () => {
    expect(JSON.stringify({ t: Time.parse('13:45') })).toBe('{"t":"13:45:00.000"}');
    expect(`${Time.parse('13:45')}`).toBe('13:45:00.000');
  });
});
