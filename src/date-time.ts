import { Date } from './date.js';
import { Duration } from './duration.js';
import { NativeDate } from './native.js';
import { Time } from './time.js';
import { assertInteger, compareNumbers, daysInMonth, fromEpoch, maxOf, minOf, pad, sortAll, toEpoch } from './utils.js';

type Components = { year: number; month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number, tzoffset?: number };

// the offset is required, a date-time without one is ambiguous
const ISO_DATE_TIME = /^([^T]{1,})T([\d:.]{1,})(Z|[+-]\d{2}:\d{2})$/;

const parseOffset = (offset: string): number => {
  if (offset === 'Z') return 0;

  const sign = offset[0] === '-' ? -1 : 1;
  const hours = Number(offset.slice(1, 3));
  const minutes = Number(offset.slice(4, 6));

  assertInteger('offset minutes', minutes, 0, 59);

  return sign * (hours * 60 + minutes) + 0;
};

const formatOffset = (tzoffset: number): string => {
  if (tzoffset === 0) return 'Z';

  const minutes = Math.abs(tzoffset);

  return `${tzoffset < 0 ? '-' : '+'}${pad(Math.trunc(minutes / 60))}:${pad(minutes % 60)}`;
};

// the date and time parts are validated by `Date` and `Time`
const parseISO = (iso: string): Components => {
  const match = ISO_DATE_TIME.exec(iso);

  if (!match) throw new RangeError(`invalid ISO date-time \`${iso}\``);

  const [, date = '', time = '', offset = ''] = match;

  return { ...Date.parse(date), ...Time.parse(time), tzoffset: parseOffset(offset) };
};

const at = (epoch: number, tzoffset: number): DateTime =>
  new DateTime({ ...fromEpoch(epoch + tzoffset * 60_000), tzoffset });

export class DateTime {
  public readonly year: number;
  public readonly month: number; // 1..12
  public readonly day: number; // 1..31
  public readonly hour: number; // 0..23
  public readonly minute: number; // 0..59
  public readonly second: number; // 0..59
  public readonly millisecond: number; // 0..999
  public readonly tzoffset: number; // in minutes
  public readonly epoch: number; // in milliseconds since Unix epoch

  constructor(components: Components) {
    const { year, month, day } = new Date(components);
    const { hour, minute, second, millisecond } = new Time({
      hour: components.hour ?? 0,
      minute: components.minute ?? 0,
      second: components.second,
      millisecond: components.millisecond,
    });
    const tzoffset = components.tzoffset ?? 0;

    assertInteger('tzoffset', tzoffset, -1439, 1439);

    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.second = second;
    this.millisecond = millisecond;
    this.tzoffset = tzoffset;
    this.epoch = toEpoch(year, month, day, hour, minute, second, millisecond) - tzoffset * 60_000;
  }

  static is(value: unknown): value is DateTime { return value instanceof DateTime }

  // an epoch is read in UTC
  static parse(value: string | number): DateTime {
    if (typeof value === 'string') return new DateTime(parseISO(value));

    // the range supported by the native `Date`
    assertInteger('epoch', value, -8.64e15, 8.64e15);

    return at(value, 0);
  }

  static nowUTC(): DateTime { return at(NativeDate.now(), 0) }
  static sort(values: DateTime[]): DateTime[] { return sortAll(values) }
  static min(values: DateTime[]): DateTime { return minOf(values) }
  static max(values: DateTime[]): DateTime { return maxOf(values) }

  add(duration: Duration): DateTime { return at(this.epoch + duration['~total'], this.tzoffset) }
  sub(duration: Duration): DateTime { return at(this.epoch - duration['~total'], this.tzoffset) }

  diff(other: DateTime): Duration {
    return new Duration({ milliseconds: other.epoch - this.epoch });
  }

  // compares instants, regardless of offset
  compare(other: DateTime): 'lt' | 'eq' | 'gt' {
    return compareNumbers(this.epoch, other.epoch);
  }

  // in the date-time's own offset
  beginningOf(unit: 'year' | 'month' | 'day'): DateTime {
    return new DateTime({
      year: this.year,
      month: unit === 'year' ? 1 : this.month,
      day: unit === 'day' ? this.day : 1,
      tzoffset: this.tzoffset,
    });
  }

  // in the date-time's own offset
  endOf(unit: 'year' | 'month' | 'day'): DateTime {
    const month = unit === 'year' ? 12 : this.month;
    const day = unit === 'day' ? this.day : daysInMonth(this.year, month);

    return new DateTime({
      year: this.year,
      month,
      day,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
      tzoffset: this.tzoffset,
    });
  }

  // the same instant, at offset 0
  utc(): DateTime { return at(this.epoch, 0) }

  date(): Date { return new Date({ year: this.year, month: this.month, day: this.day }) }
  time(): Time { return new Time({ hour: this.hour, minute: this.minute, second: this.second, millisecond: this.millisecond }) }
  toNativeDate(): InstanceType<typeof NativeDate> { return new NativeDate(this.epoch) }

  toISOString(): string {
    return `${this.date().toISOString()}T${this.time().toISOString()}${formatOffset(this.tzoffset)}`;
  }

  toJSON(): string { return this.toISOString() }
  toString(): string { return this.toISOString() }
};
