import { compareNumbers, maxOf, minOf, pad, sortAll } from './utils.js';

export class Duration {
  public readonly days: number;
  public readonly hours: number;
  public readonly minutes: number;
  public readonly seconds: number;
  public readonly milliseconds: number;
  public readonly '~total': number; // in milliseconds

  constructor(components: { days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number }) {
    // rounded so fractional inputs (e.g. `{ hours: 1 / 3 }`) don't leave float residue
    const total = Math.round(
      (components.days ?? 0) * 86_400_000
      + (components.hours ?? 0) * 3_600_000
      + (components.minutes ?? 0) * 60_000
      + (components.seconds ?? 0) * 1_000
      + (components.milliseconds ?? 0)
    );

    if (!Number.isSafeInteger(total)) {
      throw new RangeError(`invalid duration ${JSON.stringify(components)}`);
    }

    this['~total'] = total;
    this.days = Math.trunc(total / 86_400_000) + 0;
    this.hours = Math.trunc(total / 3_600_000) % 24 + 0;
    this.minutes = Math.trunc(total / 60_000) % 60 + 0;
    this.seconds = Math.trunc(total / 1_000) % 60 + 0;
    this.milliseconds = total % 1_000 + 0;
  }

  static is(value: unknown): value is Duration { return value instanceof Duration }
  static days(n: number): Duration { return new Duration({ days: n }) }
  static hours(n: number): Duration { return new Duration({ hours: n }) }
  static minutes(n: number): Duration { return new Duration({ minutes: n }) }
  static seconds(n: number): Duration { return new Duration({ seconds: n }) }
  static milliseconds(n: number): Duration { return new Duration({ milliseconds: n }) }

  static sort(values: Duration[]): Duration[] { return sortAll(values) }
  static min(values: Duration[]): Duration { return minOf(values) }
  static max(values: Duration[]): Duration { return maxOf(values) }

  add(duration: Duration): Duration {
    return new Duration({ milliseconds: this['~total'] + duration['~total'] });
  }

  sub(duration: Duration): Duration {
    return new Duration({ milliseconds: this['~total'] - duration['~total'] });
  }

  diff(other: Duration): Duration {
    return new Duration({ milliseconds: other['~total'] - this['~total'] });
  }

  compare(other: Duration): 'lt' | 'eq' | 'gt' {
    return compareNumbers(this['~total'], other['~total']);
  }

  toISOString(): string {
    if (this['~total'] === 0) return 'PT0S';

    const days = Math.abs(this.days);
    const hours = Math.abs(this.hours);
    const minutes = Math.abs(this.minutes);
    const seconds = Math.abs(this.seconds);
    const milliseconds = Math.abs(this.milliseconds);

    const fraction = milliseconds ? `.${pad(milliseconds, 3).replace(/0{1,}$/, '')}` : '';
    const time = (hours ? `${hours}H` : '')
      + (minutes ? `${minutes}M` : '')
      + (seconds || milliseconds ? `${seconds}${fraction}S` : '');

    return `${this['~total'] < 0 ? '-' : ''}P${days ? `${days}D` : ''}${time ? `T${time}` : ''}`;
  }

  toJSON(): string { return this.toISOString() }
  toString(): string { return this.toISOString() }
}

