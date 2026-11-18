import { NativeDate } from './native';

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

  constructor(iso: string)
  constructor(epoch: number)
  constructor(components: { year: number; month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number, tzoffset?: number })

  static now(): DateTime { }
  static sort(values: DateTime[]): DateTime[] { }
  static min(values: DateTime[]): DateTime { }
  static max(values: DateTime[]): DateTime { }

  add(duration: Duration): DateTime { }
  sub(duration: Duration): DateTime { }
  diff(other: DateTime): Duration { }
  compare(other: DateTime): 'lt' | 'eq' | 'gt' { }
  beginningOf(unit: 'year' | 'month' | 'day'): DateTime { }
  endOf(unit: 'year' | 'month' | 'day'): DateTime { }
  date(): Date { }
  time(): Time { }
  toNativeDate(): NativeDate { }

  toISOString(): string { }

  [Symbol.toString](): string { return this.toISOString() }
};
