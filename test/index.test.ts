import { describe, expect, it } from 'bun:test';
import { Date, DateTime, Duration, Time, compare, sort } from '../src';

describe('compare(a, b)', () => {
  it('compares each type', () => {
    expect(compare(Date.parse('2024-01-01'), Date.parse('2024-01-02'))).toBe('lt');
    expect(compare(Time.parse('12:00'), Time.parse('12:00:00.000'))).toBe('eq');
    expect(compare(Duration.days(2), Duration.hours(36))).toBe('gt');
    expect(compare(DateTime.parse('2024-01-01T12:00+02:00'), DateTime.parse('2024-01-01T10:00Z'))).toBe('eq');
  });

  it('works as an `Array.prototype.sort` comparator source', () => {
    const weights = { lt: -1, eq: 0, gt: 1 };
    const values = [Duration.hours(3), Duration.hours(1), Duration.hours(2)];

    expect(values.sort((a, b) => weights[compare(a, b)]).map(String)).toEqual(['PT1H', 'PT2H', 'PT3H']);
  });

  it('only accepts two values of the same supported type', () => {
    // type-level only, never called
    const typecheck = () => {
      // @ts-expect-error mixed types are not comparable
      compare(Date.parse('2024-01-01'), Time.parse('12:00'));

      // @ts-expect-error numbers are not supported
      compare(2, 1);
    };

    expect(typecheck).toBeFunction();
  });
});

describe('sort(items)', () => {
  it('sorts each type', () => {
    expect(sort([Date.parse('2024-03-01'), Date.parse('2023-12-31')]).map(String)).toEqual(['2023-12-31', '2024-03-01']);
    expect(sort([Time.parse('12:00'), Time.parse('08:00')]).map(String)).toEqual(['08:00:00.000', '12:00:00.000']);
    expect(sort([Duration.hours(3), Duration.hours(1)]).map(String)).toEqual(['PT1H', 'PT3H']);
    expect(sort([DateTime.parse('2024-01-01T12:00Z'), DateTime.parse('2024-01-01T12:00+02:00')]).map(String)).toEqual([
      '2024-01-01T12:00:00.000+02:00',
      '2024-01-01T12:00:00.000Z',
    ]);
  });

  it('does not mutate the input', () => {
    const values = [Duration.hours(3), Duration.hours(1)];

    sort(values);

    expect(values.map(String)).toEqual(['PT3H', 'PT1H']);
  });

  it('returns an empty array for an empty input', () => {
    const empty: Date[] = [];

    expect(sort(empty)).toEqual([]);
  });

  it('only accepts arrays of a single supported type', () => {
    // type-level only, never called
    const typecheck = () => {
      // @ts-expect-error mixed types are not comparable
      sort([Date.parse('2024-01-01'), Time.parse('12:00')]);

      // @ts-expect-error numbers are not supported
      sort([2, 1]);
    };

    expect(typecheck).toBeFunction();
  });
});
