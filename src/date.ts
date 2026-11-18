export class Date {
  public readonly year: number;
  public readonly month: number; // 1..12
  public readonly day: number; // 1..31

  constructor(iso: string)
  constructor(components: { year: number, month: number, day: number })

  static today(): Date { }
  static sort(values: Date[]): Date[] { }
  static min(values: Date[]): Date { }
  static max(values: Date[]): Date { }

  add(duration: Duration): Date { }
  sub(duration: Duration): Date { }
  diff(other: Date): Duration { }
  compare(other: Date): 'lt' | 'eq' | 'gt' { }
  beginningOf(unit: 'year' | 'month'): Date { }
  endOf(unit: 'year' | 'month'): Date { }

  toISOString(): string {
    //
  }

  [Symbol.toString]() { return this.toISOString() }
};
