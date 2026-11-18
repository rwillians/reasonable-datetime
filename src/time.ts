export class Time {
  public readonly hour: number; // 0..23
  public readonly minute: number; // 0..59
  public readonly second: number; // 0..59
  public readonly millisecond: number; // 0..999

  constructor(iso: string)
  constructor(components: { hour: number, minute: number, second?: number, millisecond?: number })

  static sort(values: Time[]): Time[] { }
  static min(values: Time[]): Time { }
  static max(values: Time[]): Time { }

  add(duration: Duration): Time { }
  sub(duration: Duration): Time { }
  diff(other: Time): Duration { }
  compare(other: Time): 'lt' | 'eq' | 'gt' { }

  toISOString(): string {
    //
  }

  [Symbol.toString]() { return this.toISOString() }
};
