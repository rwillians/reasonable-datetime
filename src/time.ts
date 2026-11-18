import { Duration } from './duration.js';
import { assertInteger, DAY, compareNumbers, fromEpoch, maxOf, minOf, pad, sortAll } from './utils.js';

const ISO_TIME = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const parseISO = (iso: string) => {
  const match = ISO_TIME.exec(iso);

  if (!match) throw new RangeError(`invalid ISO time \`${iso}\``);

  const [, hour, minute, second = '0', fraction = '0'] = match;

  return {
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: Number(fraction.padEnd(3, '0')),
  };
};

const millisecondsOf = (time: Time): number =>
  time.hour * 3_600_000 + time.minute * 60_000 + time.second * 1_000 + time.millisecond;

// wraps around midnight
const fromMilliseconds = (milliseconds: number): Time => {
  const { hour, minute, second, millisecond } = fromEpoch((milliseconds % DAY + DAY) % DAY);

  return new Time({ hour, minute, second, millisecond });
};

export class Time {
  public readonly hour: number; // 0..23
  public readonly minute: number; // 0..59
  public readonly second: number; // 0..59
  public readonly millisecond: number; // 0..999

  constructor({ hour, minute, second = 0, millisecond = 0 }: { hour: number, minute: number, second?: number, millisecond?: number }) {
    assertInteger('hour', hour, 0, 23);
    assertInteger('minute', minute, 0, 59);
    assertInteger('second', second, 0, 59);
    assertInteger('millisecond', millisecond, 0, 999);

    this.hour = hour;
    this.minute = minute;
    this.second = second;
    this.millisecond = millisecond;
  }

  static is(value: unknown): value is Time { return value instanceof Time }
  static parse(iso: string): Time { return new Time(parseISO(iso)) }

  static sort(values: Time[]): Time[] { return sortAll(values) }
  static min(values: Time[]): Time { return minOf(values) }
  static max(values: Time[]): Time { return maxOf(values) }

  add(duration: Duration): Time { return fromMilliseconds(millisecondsOf(this) + duration['~total']) }
  sub(duration: Duration): Time { return fromMilliseconds(millisecondsOf(this) - duration['~total']) }

  diff(other: Time): Duration {
    return new Duration({ milliseconds: millisecondsOf(other) - millisecondsOf(this) });
  }

  compare(other: Time): 'lt' | 'eq' | 'gt' {
    return compareNumbers(millisecondsOf(this), millisecondsOf(other));
  }

  toISOString(): string {
    return `${pad(this.hour)}:${pad(this.minute)}:${pad(this.second)}.${pad(this.millisecond, 3)}`;
  }

  toJSON(): string { return this.toISOString() }
  toString(): string { return this.toISOString() }
};
