import { Date } from './date.js';
import { DateTime } from './date-time.js';
import { Duration } from './duration.js';
import { Time } from './time.js';
import { type Comparable, type Order, sortAll } from './utils.js';

type Compare = {
  <T extends Date>(a: T, b: T): Order;
  <T extends DateTime>(a: T, b: T): Order;
  <T extends Duration>(a: T, b: T): Order;
  <T extends Time>(a: T, b: T): Order;
};

type Sort = {
  <T extends Date>(items: T[]): T[];
  <T extends DateTime>(items: T[]): T[];
  <T extends Duration>(items: T[]): T[];
  <T extends Time>(items: T[]): T[];
};

export const nowUTC = DateTime.nowUTC.bind(DateTime);
export const todayUTC = Date.todayUTC.bind(Date);
export const days = Duration.days.bind(Duration);
export const hours = Duration.hours.bind(Duration);
export const minutes = Duration.minutes.bind(Duration);
export const seconds = Duration.seconds.bind(Duration);
export const milliseconds = Duration.milliseconds.bind(Duration);
export const sort: Sort = <T extends Comparable<T>>(items: T[]): T[] => sortAll(items);
export const compare: Compare = <T extends Comparable<T>>(a: T, b: T): Order => a.compare(b);

export { Date } from './date.js';
export { DateTime } from './date-time.js';
export { Duration } from './duration.js';
export { Time } from './time.js';
