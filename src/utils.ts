import { NativeDate } from './native.js';

export type Order = 'lt' | 'eq' | 'gt';

export type Comparable<T> = { compare(other: T): Order };

export const DAY = 86_400_000; // in milliseconds

const weights = { lt: -1, eq: 0, gt: 1 } as const;

export const compareNumbers = (a: number, b: number): Order =>
  a < b ? 'lt' : a > b ? 'gt' : 'eq';

export const sortAll = <T extends Comparable<T>>(values: T[]): T[] =>
  [...values].sort((a, b) => weights[a.compare(b)]);

export const minOf = <T extends Comparable<T>>(values: T[]): T => {
  if (values.length === 0) throw new RangeError('cannot get the min of an empty list');

  return values.reduce((min, value) => value.compare(min) === 'lt' ? value : min);
};

export const maxOf = <T extends Comparable<T>>(values: T[]): T => {
  if (values.length === 0) throw new RangeError('cannot get the max of an empty list');

  return values.reduce((max, value) => value.compare(max) === 'gt' ? value : max);
};

export const assertInteger = (name: string, value: number, min: number, max: number): void => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}, got ${value}`);
  }
};

export const pad = (value: number, length = 2): string =>
  value.toString().padStart(length, '0');

// `setUTCFullYear` instead of `Date.UTC` because the latter maps years 0..99 to 1900..1999
export const toEpoch = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0, millisecond = 0): number => {
  const native = new NativeDate(0);

  native.setUTCFullYear(year, month - 1, day);
  native.setUTCHours(hour, minute, second, millisecond);

  return native.getTime();
};

export const fromEpoch = (epoch: number) => {
  const native = new NativeDate(epoch);

  return {
    year: native.getUTCFullYear(),
    month: native.getUTCMonth() + 1,
    day: native.getUTCDate(),
    hour: native.getUTCHours(),
    minute: native.getUTCMinutes(),
    second: native.getUTCSeconds(),
    millisecond: native.getUTCMilliseconds(),
  };
};

// day `0` of the next month is the last day of this month
export const daysInMonth = (year: number, month: number): number =>
  fromEpoch(toEpoch(year, month + 1, 0)).day;
