import { disposalMethodOptions, returnMethodOptions } from '~/discMethods';
import type { MethodOption } from '~/lib/methodEnum';
import type { DiscDTO } from '~/types';
import type { BarValueType } from '~/ui/BarChart';
import { getMonthName } from '~/utils';
import { format, isWithinInterval, lastDayOfMonth } from 'date-fns';

export type LostDiscsProps = {
  data: DiscDTO[];
};

export type AddedDiscCountByMonthType = {
  dataTopic: number;
  amount: number;
  date?: Date;
};

export const mapBarData = (data: AddedDiscCountByMonthType[]): BarValueType[] => {
  return data.map((item) => {
    return {
      label: '',
      value: item.amount,
      date: item.date,
    };
  });
};

export const getLegendItems = (data: AddedDiscCountByMonthType[]): string[] => {
  return data.map((item) => getMonthName(item.date));
};

export const getLegendItems2 = (data: AddedDiscCountByMonthType[]): string[] => {
  return data.map((item) => (item.date ? format(item.date, 'dd') : ''));
};

export function mapBySeparator(
  data: DiscDTO[],
  getSeparator: (date: Date) => number | string,
  getMonthData: (data: DiscDTO) => Date | null,
): { [key: number]: { value: number; date?: Date } } {
  const mapped: { [key: number | string]: { value: number; date?: Date } } = {};

  data.forEach((item: DiscDTO) => {
    // const date = new Date(item.addedAt);
    const date = getMonthData(item);
    const separator = date ? getSeparator(date) : null;

    if (!separator) {
      return;
    }

    const prevValue: number = mapped[separator] ? mapped[separator].value : 0;

    if (!mapped[separator]) {
      mapped[separator] = { value: 0, date: date ?? undefined };
    }

    mapped[separator].value = prevValue + 1;
  });

  return mapped;
}

export function sortMappedData(mapped: {
  [key: number | string]: { value: number; date?: Date };
}): AddedDiscCountByMonthType[] {
  const keys = Object.keys(mapped);
  const res: AddedDiscCountByMonthType[] = keys.map((key) => {
    return {
      dataTopic: parseInt(key, 10) + 1,
      amount: mapped[key].value,
      date: mapped[key].date,
    };
  });

  return res.sort((a, b) => {
    if (!b.date || !a.date) {
      return 0;
    }

    if (b.date > a.date) {
      return -1;
    }

    if (b.date < a.date) {
      return 1;
    }

    return 0;
  });
}

export function getAddedDiscCountByMonth(
  data: DiscDTO[],
  getSeparator: (date: Date) => number | string,
  getMonthData: (data: DiscDTO) => Date | null,
): AddedDiscCountByMonthType[] {
  const mapped = mapBySeparator(data, getSeparator, getMonthData);

  return sortMappedData(mapped);
}

export function getAddedDiscCountByDaysInMonth(
  date: Date,
  data: DiscDTO[],
  getSeparator: (date: Date) => number,
  getMonthData: (data: DiscDTO) => Date | null,
): AddedDiscCountByMonthType[] {
  const firstDay: Date | null = date ? new Date(format(date, 'yyyy-MM-01')) : null;
  const lastDay: Date | null = date ? lastDayOfMonth(date) : null;

  const filtered = data.filter((item) => {
    if (firstDay === null || lastDay === null) {
      return false;
    }

    const md = getMonthData(item);
    return md && isWithinInterval(md, { start: firstDay, end: lastDay });
  });

  const mapped = mapBySeparator(filtered, getSeparator, getMonthData);

  return sortMappedData(mapped);
}

export function getDonatedOrSoldDiscCount(data: DiscDTO[]): number {
  return data.filter(isDonatedOrSold).length;
}

export function getReturnedDiscCount(data: DiscDTO[]): number {
  return data.filter(isReturnedToOwner).length;
}

/** One line of a method breakdown: the Finnish label, and how many discs have it. */
export type MethodCount = {
  label: string;
  value: number;
};

/**
 * How the discs the club released were meant to go: "Myydään" (to be sold),
 * "Lahjoitetaan" (to be donated), "Ei kirjattu" (not recorded).
 */
export function getDisposalMethodCounts(data: DiscDTO[]): MethodCount[] {
  return countByMethod(data.filter(isDonatedOrSold), (item) => item.canBeSoldOrDonatedMethod, disposalMethodOptions);
}

/**
 * How the discs that reached their owners got there: "Postitettu" (posted),
 * "Noudettu" (picked up), "Ei kirjattu".
 */
export function getReturnMethodCounts(data: DiscDTO[]): MethodCount[] {
  return countByMethod(data.filter(isReturnedToOwner), (item) => item.returnMethod, returnMethodOptions);
}

// Shared with the two headline counts above, so a breakdown can never be drawn
// from a different set of discs than the total printed over it.
function isDonatedOrSold(item: DiscDTO): boolean {
  return Boolean(item.canBeSoldOrDonated);
}

function isReturnedToOwner(item: DiscDTO): boolean {
  return Boolean(item.isReturnedToOwner);
}

/**
 * Splits an already-counted set of discs by the method stored against them.
 *
 * The labels come from the method enums rather than being retyped, so this and
 * the disc table can never disagree about what a stored `1` means.
 *
 * Discs with no method get their own line instead of being dropped: neither
 * column existed while the club ran on the Google Sheet, so most of the
 * inherited rows are null, and a breakdown that left them out would not add up
 * to the total printed above it. The line is omitted when there are none, so a
 * club that has always recorded the method never sees it.
 */
function countByMethod(
  discs: DiscDTO[],
  getMethod: (disc: DiscDTO) => number | null | undefined,
  options: readonly MethodOption[],
): MethodCount[] {
  const counts: MethodCount[] = options.map((option) => ({
    label: option.label,
    value: discs.filter((disc) => getMethod(disc) === option.value).length,
  }));

  const notRecorded = discs.filter((disc) => getMethod(disc) == null).length;

  return notRecorded > 0 ? [...counts, { label: 'Ei kirjattu', value: notRecorded }] : counts;
}

export type DiscNameStat = {
  label: string;
  value: number;
};

export type TopLostDiscsOptions = {
  /** Count "Destroyer, Star" and "destroyer" as the same model. */
  groupByDiscName?: boolean;
  limit?: number;
};

/**
 * Counts how often each disc model was lost, most-lost first.
 *
 * Without `groupByDiscName` the stored string is the model, so "Destroyer, Star"
 * and "Destroyer, Halo" are two entries. With it, everything from the first
 * comma onwards is dropped as the plastic and the remainder is matched
 * case-insensitively, which is what folds the two into one "Destroyer".
 */
export function getTopLostDiscsByDiscName(data: DiscDTO[], options: TopLostDiscsOptions = {}): DiscNameStat[] {
  const groups = new Map<string, { value: number; spellings: Map<string, number> }>();

  data.forEach((item: DiscDTO) => {
    const spelling = options.groupByDiscName ? getDiscModelName(item.discName) : item.discName;
    const key = options.groupByDiscName ? spelling.toLowerCase() : spelling;

    const group = groups.get(key) ?? { value: 0, spellings: new Map<string, number>() };

    group.value += 1;
    group.spellings.set(spelling, (group.spellings.get(spelling) ?? 0) + 1);

    groups.set(key, group);
  });

  const stats: DiscNameStat[] = [...groups.values()].map((group) => {
    return { label: pickCommonestSpelling(group.spellings), value: group.value };
  });

  const sorted = stats.sort((a: DiscNameStat, b: DiscNameStat) => b.value - a.value);

  return options.limit ? sorted.slice(0, options.limit) : sorted;
}

/**
 * The mould name out of a stored disc name: admins type the mould first and the
 * plastic after a comma ("Destroyer, Star"), and a few rows use a full stop
 * where the comma was meant ("Essence. NEO"). A name that is nothing but a
 * separator keeps its original text rather than collapsing to an empty bar.
 */
function getDiscModelName(discName: string): string {
  const model = discName.split(/[,.]/)[0].trim().replace(/\s+/g, ' ');

  return model.length > 0 ? model : discName.trim();
}

/**
 * The label a merged group is shown under. Ties go to the spelling seen first,
 * because `Map` keeps insertion order.
 */
function pickCommonestSpelling(spellings: Map<string, number>): string {
  let commonest = '';
  let highest = 0;

  for (const [spelling, count] of spellings) {
    if (count > highest) {
      commonest = spelling;
      highest = count;
    }
  }

  return commonest;
}
