import { format, getMonth as getMonthNumber, getYear as getYearFromDate } from 'date-fns';

import type { DiscDTO } from '~/types';

export function getDistinctDiscNames(discs: DiscDTO[]): string[] {
  const set = new Set<string>();

  const unique: string[] = [];

  discs.forEach((disc: DiscDTO) => {
    if (!set.has(disc?.discName?.toLowerCase())) {
      set.add(disc?.discName?.toLowerCase());
      unique.push(disc?.discName);
    }
  });

  return unique;
}

/**
 * The course names actually present in the list, for the course filter. Clubs
 * with a single course (or none recorded) yield fewer than two names, which is
 * how the list page knows not to show the filter at all. Discs with no course
 * recorded are left out of the options and only appear under "all courses".
 */
export function getDistinctCourses(discs: DiscDTO[]): string[] {
  const unique = new Set<string>();

  discs.forEach((disc: DiscDTO) => {
    if (disc.course) {
      unique.add(disc.course);
    }
  });

  return [...unique].sort((a, b) => a.localeCompare(b, 'fi'));
}

type GroupedType = {
  [index: string]: string[];
};

export function groupByInitialCharacter(data: string[]) {
  const values: GroupedType = {};

  data.forEach((item: string) => {
    const firstChar = item.slice(0, 1);
    const items = values[firstChar] ? values[firstChar] : [];
    values[firstChar] = [...items, item];
  });

  return values;
}

/** The operator prefix a Finnish number is grouped after: the 0 and two digits. */
const PHONE_PREFIX_LENGTH = 3;

/** The trailing group. Four digits, so the tail reads as one block. */
const PHONE_LAST_GROUP_LENGTH = 4;

/**
 * Groups a phone number for reading: 0501234567 becomes "050 123 4567".
 *
 * A number one digit too long keeps the four-digit tail and grows the middle
 * group instead — 05012345678 becomes "050 1234 5678". An international number
 * is grouped the same way after its country code: +3723334444 becomes
 * "+372 333 4444". No prefix is added to a number that has none, since almost
 * every owner here is Finnish.
 *
 * Display only. The stored value is what the phone search matches on, and it
 * stays as the club entered it.
 *
 * Anything whose shape is not recognised is returned as entered rather than
 * grouped on a guess. That covers a good deal of the real data: a '?' where the
 * club could not read a digit off the slip, brackets and dashes on a number
 * that was never in Finnish form, and the fragments that are simply too short.
 */
export function formatPhoneNumber(value?: string | null): string {
  if (!value) {
    return '';
  }

  const entered = value.trim();

  // Only digits, spaces and a leading '+' may be regrouped. A '?' or a bracket
  // means the value is not a plain number, and rewriting it would misrepresent
  // what the club wrote down.
  if (!/^\+?[\d ]+$/.test(entered)) {
    return entered;
  }

  const isInternational = entered.startsWith('+');
  const digits = entered.replace(/\D/g, '');

  // Ten digits is the full domestic form, eleven the same with one digit too
  // many written down. An international number is assumed to carry a
  // three-digit country code, which covers Finland and its neighbours (+358,
  // +372, +370, +371); the same two lengths then leave no group under three
  // digits. Every other length is a partial number, and every grouping of one
  // would be an invention.
  const hasKnownLength = digits.length === 10 || digits.length === 11;
  const hasKnownShape = hasKnownLength && (isInternational || digits.startsWith('0'));

  if (!hasKnownShape) {
    return entered;
  }

  const prefix = digits.slice(0, PHONE_PREFIX_LENGTH);
  const rest = digits.slice(PHONE_PREFIX_LENGTH);
  const middle = rest.slice(0, rest.length - PHONE_LAST_GROUP_LENGTH);
  const last = rest.slice(-PHONE_LAST_GROUP_LENGTH);

  return `${isInternational ? '+' : ''}${prefix} ${middle} ${last}`;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) {
    return '';
  }

  const formattedDate = new Intl.DateTimeFormat('fi-FI').format(new Date(dateStr));

  return formattedDate;
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) {
    return '';
  }

  return new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr));
}

export function getMonth(date: Date): number {
  return getMonthNumber(date);
}

export function getDayOfMonth(date: Date): number {
  return parseInt(format(date, 'd'), 10);
}

type MonthStyle = 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';

export function getMonthName(date?: Date, mode: MonthStyle = 'short'): string {
  if (!date) {
    return '';
  }

  return date.toLocaleString('fi-FI', { month: mode });
}

export function getWeekdayName(date?: Date): string {
  if (!date) {
    return '';
  }

  return date.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric' }) + 'ss';
}

export function getYear(date: Date): number {
  return getYearFromDate(date);
}
