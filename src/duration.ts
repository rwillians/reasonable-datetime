export class Duration {
  public readonly days: number;
  public readonly hours: number;
  public readonly minutes: number;
  public readonly seconds: number;
  public readonly milliseconds: number;
  readonly #total: number; // in milliseconds

  constructor(components: { days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number }) {
    const total = (components.days ?? 0) * 86_400_000
      + (components.hours ?? 0) * 3_600_000
      + (components.minutes ?? 0) * 60_000
      + (components.seconds ?? 0) * 1_000
      + (components.milliseconds ?? 0);

    this.#total = total;
    this.days = Math.trunc(total / 86_400_000) + 0;
    this.hours = Math.trunc(total / 3_600_000) % 24 + 0;
    this.minutes = Math.trunc(total / 60_000) % 60 + 0;
    this.seconds = Math.trunc(total / 1_000) % 60 + 0;
    this.milliseconds = total % 1_000 + 0;
  }

  static days(n: number): Duration {}
  static hours(n: number): Duration {}
  static minutes(n: number): Duration {}
  static seconds(n: number): Duration {}
  static milliseconds(n: number): Duration {}

  static sort(values: Duration[]): Duration[] { }
  static min(values: Duration[]): Duration { }
  static max(values: Duration[]): Duration { }

  add(duration: Duration): Duration { }
  sub(duration: Duration): Duration { }
  diff(other: Duration): Duration { }
  compare(other: Duration): 'lt' | 'eq' | 'gt' {
    if (this.#total < other.#total) return 'lt';
    if (this.#total > other.#total) return 'gt';
    return 'eq';
  }

  toISOString(): string {
    //
  }

  [Symbol.toString]() { return this.toISOString() }
}
