import { format, getMonth as getMonthNumber, getYear as getYearFromDate } from 'date-fns';

import { DiscDTO } from '~/types';

export function getDistinctDiscNames(discs: DiscDTO[]): string[] {
  const set = new Set<string>();

  const unique: string[] = [];

  discs.map((disc: DiscDTO) => {
    if (!set.has(disc?.discName?.toLowerCase())) {
      set.add(disc?.discName?.toLowerCase());
      unique.push(disc?.discName);
    }
  });

  return unique;
}

type GroupedType = {
  [index: string]: string[];
};

export function groupByInitialCharacter(data: string[]) {
  const values: GroupedType = {};

  data.map((item: string) => {
    const firstChar = item.slice(0, 1);
    const items = values[firstChar] ? values[firstChar] : [];
    values[firstChar] = [...items, item];
  });

  return values;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) {
    return '';
  }

  const formattedDate = new Intl.DateTimeFormat('fi-FI').format(new Date(dateStr));

  return formattedDate;
}

export function getMonth(date: Date): number {
  return getMonthNumber(date);
}

export function getDayOfMonth(date: Date): number {
  return parseInt(format(date, 'd'), 10);
}

export function getMonthName(date?: Date, mode: string = 'short'): string {
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
