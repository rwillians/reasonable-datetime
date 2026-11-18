# Reasonable DateTime

Reasonable date and time primitives for JavaScript.

JavaScript's native `Date` is a single type doing the job of several: it is an
instant, a calendar date and a wall-clock time all at once, it silently
accepts invalid input, it counts months from zero and it is mutable.

This library gives each concept its own small, immutable type:

| type       | represents                                   | example                         |
| :--------- | :------------------------------------------- | :------------------------------ |
| `Date`     | a calendar date, no time and no timezone     | `2024-02-29`                    |
| `Time`     | a wall-clock time, no date and no timezone   | `13:45:00.000`                  |
| `DateTime` | an instant, seen from a fixed UTC offset     | `2024-02-29T13:45:00.000-03:00` |
| `Duration` | an exact length of time, in days and smaller | `P1DT12H`                       |

It is meant to be simpler than [Temporal][temporal]: no calendars other than
ISO 8601, no IANA timezones, no daylight saving time, no months or years in
durations.

[temporal]: https://tc39.es/proposal-temporal/docs/

## Installation

```sh
npm install reasonable-datetime
```

## Quick start

```ts
import * as r from 'reasonable-datetime';

const due = r.Date.parse('2024-02-28').add(r.Duration.days(2));
due.toISOString(); // => '2024-03-01'

const meeting = r.DateTime.parse('2024-02-29T13:45-03:00');
meeting.add(r.Duration.minutes(90)).toISOString(); // => '2024-02-29T15:15:00.000-03:00'

const lunch = r.Time.parse('12:00');
lunch.diff(r.Time.parse('13:30')).toISOString(); // => 'PT1H30M'

JSON.stringify({ due, meeting }); // => '{"due":"2024-03-01","meeting":"2024-02-29T13:45:00.000-03:00"}'
```

> **Tip:** this library exports a class named `Date`, which shadows the native
> `Date` wherever it is imported by name. A namespace import
> (`import * as r from 'reasonable-datetime'`) or a renamed import
> (`import { Date as CalendarDate } from 'reasonable-datetime'`) avoids that.

## Common behavior

Every type follows the same rules:

- **Construction.** `new` takes the fields; the static `parse` reads an ISO
  string (or, for `DateTime`, milliseconds since the Unix epoch).
- **Immutable.** Fields are read-only and every operation returns a new
  instance.
- **Strict.** Malformed strings and out-of-range fields throw a `RangeError`
  instead of rolling over — `2023-02-29`, `24:00` and `13:60` are all errors.
- **Months start at 1.** January is `1`, December is `12`.
- **Years range from 0 to 9999**, so ISO strings always have a 4-digit year.
  Years 0 to 99 are taken literally (`0050` is year 50, not 1950).
- **Serializes as ISO 8601.** `toISOString()`, `toString()` and `toJSON()`
  return the same string, so instances work in template literals and
  `JSON.stringify`.
- **Comparison** returns `'lt'`, `'eq'` or `'gt'`.
- **`diff` goes from `this` to `other`.** `a.diff(b)` is `b − a`, so
  `a.add(a.diff(b))` is always `b`.
- **Collections.** Each type has static `sort`, `min` and `max`. `sort`
  returns a new array (the input is left untouched); `min` and `max` throw a
  `RangeError` on an empty array.

```ts
const dates = [r.Date.parse('2024-03-01'), r.Date.parse('2023-12-31')];

r.Date.sort(dates).map(String); // => ['2023-12-31', '2024-03-01']
r.Date.min(dates).toString();   // => '2023-12-31'
```

## `Date`

A calendar date: a year, a month and a day. No time, no timezone.

```ts
r.Date.parse('2024-02-29');                       // from an ISO date (YYYY-MM-DD)
new r.Date({ year: 2024, month: 2, day: 29 });    // from its fields
r.Date.todayUTC();                                // the current date in UTC
```

| field   | range     |
| :------ | :-------- |
| `year`  | `0..9999` |
| `month` | `1..12`   |
| `day`   | `1..31`   |

| method                           | returns                | description                                  |
| :------------------------------- | :--------------------- | :------------------------------------------- |
| `add(duration)`                  | `Date`                 | moves forward by a whole number of days      |
| `sub(duration)`                  | `Date`                 | moves backward by a whole number of days     |
| `diff(other)`                    | `Duration`             | the number of days from this date to `other` |
| `compare(other)`                 | `'lt' \| 'eq' \| 'gt'` | compares dates                               |
| `beginningOf('year' \| 'month')` | `Date`                 | the first day of the year or month           |
| `endOf('year' \| 'month')`       | `Date`                 | the last day of the year or month            |
| `toISOString()`                  | `string`               | e.g. `'2024-02-29'`                          |

Dates only move in whole days. Adding a duration with leftover hours, minutes,
seconds or milliseconds throws a `RangeError`:

```ts
const date = r.Date.parse('2024-01-01');

date.add(r.Duration.hours(48)).toISOString(); // => '2024-01-03'
date.add(r.Duration.hours(5));                // throws RangeError

r.Date.parse('2024-02-14').endOf('month').toISOString(); // => '2024-02-29'
```

## `Time`

A wall-clock time, with millisecond precision. No date, no timezone.

```ts
r.Time.parse('13:45');                            // HH:MM
r.Time.parse('13:45:30');                         // HH:MM:SS
r.Time.parse('13:45:30.5');                       // HH:MM:SS.s, up to 3 fraction digits
new r.Time({ hour: 13, minute: 45 });             // second and millisecond default to 0
```

| field         | range    |
| :------------ | :------- |
| `hour`        | `0..23`  |
| `minute`      | `0..59`  |
| `second`      | `0..59`  |
| `millisecond` | `0..999` |

| method           | returns                | description                                  |
| :--------------- | :--------------------- | :------------------------------------------- |
| `add(duration)`  | `Time`                 | moves forward, wrapping around midnight      |
| `sub(duration)`  | `Time`                 | moves backward, wrapping around midnight     |
| `diff(other)`    | `Duration`             | the time from this time to `other`           |
| `compare(other)` | `'lt' \| 'eq' \| 'gt'` | compares times                               |
| `toISOString()`  | `string`               | always `HH:MM:SS.sss`, e.g. `'13:45:00.000'` |

Times wrap around midnight, so adding whole days leaves a time unchanged:

```ts
r.Time.parse('23:00').add(r.Duration.hours(2)).toISOString(); // => '01:00:00.000'
r.Time.parse('10:00').add(r.Duration.days(3)).toISOString();  // => '10:00:00.000'
```

## `DateTime`

An instant in time, together with the fixed UTC offset it is viewed from. The
date and time fields are the wall-clock reading at that offset.

```ts
r.DateTime.parse('2024-02-29T13:45:30.5-03:00');  // from an ISO date-time
r.DateTime.parse(1709225130500);                  // from milliseconds since the Unix epoch, in UTC
new r.DateTime({                                  // from its fields
  year: 2024, month: 2, day: 29,
  hour: 13, minute: 45,                           // time fields default to 0
  tzoffset: -180,                                 // defaults to 0 (UTC)
});
r.DateTime.nowUTC();                              // the current instant, in UTC
```

ISO strings must include an offset, either `Z` or `±HH:MM`. A date-time without
one is ambiguous, so `r.DateTime.parse('2024-02-29T13:45')` throws a
`RangeError`.

| field         | range                                                  |
| :------------ | :----------------------------------------------------- |
| `year`        | `0..9999`                                              |
| `month`       | `1..12`                                                |
| `day`         | `1..31`                                                |
| `hour`        | `0..23`                                                |
| `minute`      | `0..59`                                                |
| `second`      | `0..59`                                                |
| `millisecond` | `0..999`                                               |
| `tzoffset`    | `-1439..1439`, minutes east of UTC (`+05:30` is `330`) |
| `epoch`       | milliseconds since `1970-01-01T00:00:00Z`              |

> **Note:** `tzoffset` has the opposite sign of the native
> `Date.prototype.getTimezoneOffset()`: here, `-03:00` is `-180`.

| method                                    | returns                | description                                                       |
| :---------------------------------------- | :--------------------- | :---------------------------------------------------------------- |
| `add(duration)`                           | `DateTime`             | moves forward, keeping the offset                                 |
| `sub(duration)`                           | `DateTime`             | moves backward, keeping the offset                                |
| `diff(other)`                             | `Duration`             | the exact time from this instant to `other`                       |
| `compare(other)`                          | `'lt' \| 'eq' \| 'gt'` | compares instants, regardless of offset                           |
| `beginningOf('year' \| 'month' \| 'day')` | `DateTime`             | the first millisecond of the unit, at this offset                 |
| `endOf('year' \| 'month' \| 'day')`       | `DateTime`             | the last millisecond of the unit (`23:59:59.999`), at this offset |
| `date()`                                  | `Date`                 | the date at this offset                                           |
| `time()`                                  | `Time`                 | the time at this offset                                           |
| `toNativeDate()`                          | native `Date`          | the same instant as a native `Date`                               |
| `toISOString()`                           | `string`               | e.g. `'2024-02-29T13:45:00.000-03:00'`, or `…Z` for UTC           |

Two date-times at the same instant are equal, whatever their offsets:

```ts
const a = r.DateTime.parse('2024-01-01T12:00+02:00');
const b = r.DateTime.parse('2024-01-01T10:00Z');

a.compare(b);           // => 'eq'
a.diff(b).toISOString(); // => 'PT0S'
```

Because offsets are fixed, a day is always exactly 24 hours — there is no
daylight saving time to account for:

```ts
const night = r.DateTime.parse('2024-02-29T23:30-03:00');

night.date().toISOString();         // => '2024-02-29'
night.toNativeDate().toISOString(); // => '2024-03-01T02:30:00.000Z'
```

## `Duration`

An exact length of time, positive or negative. Durations have no months or
years, since those have no fixed length, so any two durations can be compared.

```ts
new r.Duration({ days: 1, hours: 12 });           // any combination of fields, all optional
r.Duration.days(1);
r.Duration.hours(1.5);                            // fractions are fine: 1 hour and 30 minutes
r.Duration.minutes(5);
r.Duration.seconds(30);
r.Duration.milliseconds(250);
```

Fields are normalized, so every duration has a single representation:

```ts
const duration = new r.Duration({ hours: 36 });

duration.days;  // => 1
duration.hours; // => 12
```

| field          | range     |
| :------------- | :-------- |
| `days`         | any       |
| `hours`        | `±0..23`  |
| `minutes`      | `±0..59`  |
| `seconds`      | `±0..59`  |
| `milliseconds` | `±0..999` |

A negative duration has every field negative: `-36` hours is `{ days: -1,
hours: -12 }`. The total is rounded to whole milliseconds, and non-finite
values (`NaN`, `Infinity`) throw a `RangeError`.

| method           | returns                | description                            |
| :--------------- | :--------------------- | :------------------------------------- |
| `add(duration)`  | `Duration`             | the sum                                |
| `sub(duration)`  | `Duration`             | the difference, `this − duration`      |
| `diff(other)`    | `Duration`             | the difference, `other − this`         |
| `compare(other)` | `'lt' \| 'eq' \| 'gt'` | compares total lengths                 |
| `toISOString()`  | `string`               | an ISO 8601 duration, e.g. `'P1DT12H'` |

```ts
r.Duration.hours(36).compare(r.Duration.days(2)); // => 'lt'

new r.Duration({}).toISOString();                 // => 'PT0S'
r.Duration.milliseconds(-1250).toISOString();     // => '-PT1.25S'
```

## License

[MIT](./LICENSE)
