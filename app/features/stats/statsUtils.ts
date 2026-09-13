import { disposalMethodOptions, returnMethodOptions } from '~/discMethods';
import type { MethodOption } from '~/lib/methodEnum';
import type { DiscDTO } from '~/types';
import type { BarValueType } from '~/ui/BarChart';
import { getMonthName } from '~/utils';
import { format, isWithinInterval, lastDayOfMonth, parse } from 'date-fns';

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

/** Either one year, or every disc whatever its date. */
export type YearSelection = number | 'all';

/** A disc's relevant date for one statistic, or null when it has none. */
export type GetDiscDate = (disc: DiscDTO) => Date | null;

/** A set of discs together with the date that places each of them in a year. */
export type DatedDiscs = {
  discs: DiscDTO[];
  getDate: GetDiscDate;
};

export type YearFilterResult = {
  discs: DiscDTO[];
  /** Discs dropped for having no usable date. Always 0 under 'all'. */
  undated: number;
};

/**
 * The date a disc went back to its owner, from one of two places:
 * returned_to_owner_date, written by the admin tool, or the leading d.M.yyyy of
 * the free-text note copied from the Google Sheet ("29.8.2026 (Janimatti),
 * postitettu"), which is all the older rows have.
 *
 * Shared with DiscsReturnedToOwner so the returned-to-owner total and the
 * monthly chart under it cannot disagree about when a disc went home.
 */
export function getReturnDate(disc: DiscDTO): Date | null {
  if (disc.returnedToOwnerDate) {
    return toDayDate(disc.returnedToOwnerDate);
  }

  if (!disc.returnedToOwnerText) {
    return null;
  }

  const leadingDate = disc.returnedToOwnerText.match(/^\d+\.\d+\.\d+/);

  return leadingDate?.length === 1 ? toDate(leadingDate[0], 'd.M.yyyy') : null;
}

/**
 * The date the club released a disc for sale or donation. Null on most rows:
 * the column was added long after the club started releasing discs, and the
 * Google Sheet import leaves it empty. See the spec for what that costs.
 */
export function getDisposalDate(disc: DiscDTO): Date | null {
  return disc.canBeSoldOrDonatedDate ? toDayDate(disc.canBeSoldOrDonatedDate) : null;
}

/**
 * Narrows a set of discs to one year, and reports how many it could not place.
 *
 * An undated disc belongs to no year, so the year figures can only ever be
 * smaller than the all-time one. The count comes back rather than being
 * silently dropped, because on the disposal total it is nine discs in ten and
 * the page has to be able to say so.
 */
export function filterDiscsByYear({ discs, getDate }: DatedDiscs, year: YearSelection): YearFilterResult {
  if (year === 'all') {
    return { discs, undated: 0 };
  }

  const withYears = discs.map((disc) => ({ disc, year: toPlausibleYear(getDate(disc)) }));

  return {
    discs: withYears.filter((item) => item.year === year).map((item) => item.disc),
    undated: withYears.filter((item) => item.year === null).length,
  };
}

/**
 * The years one total actually has data for, ascending. A date outside
 * `toPlausibleYear`'s bound gets no button.
 */
export function getStatsYears({ discs, getDate }: DatedDiscs): number[] {
  const years = new Set<number>();

  discs.forEach((disc) => {
    const year = toPlausibleYear(getDate(disc));

    if (year !== null) {
      years.add(year);
    }
  });

  return [...years].sort((a, b) => a - b);
}

/**
 * Whether a total is offered "Kaikki" (all) at all.
 *
 * Only once it spans more than one year. On a single year "Kaikki" is not even
 * a synonym for that year — it also folds in every disc whose date was never
 * recorded, so on the sale total it reads 496 beside 2026's 45.
 *
 * The buttons, the starting selection and the drift check all ask this one
 * question, so the rule cannot be changed in one of them and missed in the
 * other two.
 */
export function offersAllYears(years: number[]): boolean {
  return years.length > 1;
}

/**
 * What a total's filter starts on: the all-time figure when "Kaikki" is
 * offered, and otherwise the only year there is. A total with no dated disc
 * has no buttons at all, and falls back to the all-time figure.
 *
 * It lives here rather than beside YearFilter so the unit tests can reach it
 * without pulling a StyleX component into a plain Node test run.
 */
export function getDefaultYear(years: number[]): YearSelection {
  return offersAllYears(years) || years.length === 0 ? 'all' : years[0];
}

/**
 * The year a total is actually showing, given what the admin last clicked and
 * what the data now offers.
 *
 * The two can disagree: the loader revalidates while the page is open, and a
 * selection made against the old data may name a year that no longer has a
 * button — or be 'all' after the years shrank to one, which would print the
 * all-time figure with nothing on screen offering it. Either way the total
 * falls back to its default rather than showing a count no button explains.
 */
export function getSelectedYear(selected: YearSelection, years: number[]): YearSelection {
  if (selected === 'all') {
    return offersAllYears(years) ? 'all' : getDefaultYear(years);
  }

  return years.includes(selected) ? selected : getDefaultYear(years);
}

/**
 * The oldest disc in a set that carries a usable date, so a total can say how
 * far back it actually reaches.
 *
 * Worth printing because the two totals start in different places and neither
 * start is obvious: the club only began recording a disposal date in September
 * 2026, while the returns reach back to 2024 through the dates written into the
 * Google Sheet notes.
 */
export function getEarliestDate({ discs, getDate }: DatedDiscs): Date | null {
  let earliest: Date | null = null;

  // A for...of rather than forEach: inside a callback TypeScript cannot see
  // that `earliest` is reassigned, and narrows it to `null` for everything
  // after the loop.
  for (const disc of discs) {
    const date = getDate(disc);

    if (date !== null && toPlausibleYear(date) !== null && (earliest === null || date < earliest)) {
      earliest = date;
    }
  }

  return earliest;
}

/** The discs the club has released for sale or donation. */
export function getDonatedOrSoldDiscs(data: DiscDTO[]): DiscDTO[] {
  return data.filter(isDonatedOrSold);
}

/** The discs that reached their owners. */
export function getReturnedDiscs(data: DiscDTO[]): DiscDTO[] {
  return data.filter(isReturnedToOwner);
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

/** One year of a model's total, for the stacked bar under it. */
export type YearCount = {
  year: number;
  value: number;
};

export type DiscNameStat = {
  label: string;
  value: number;
  /** Ascending by year, summing to `value`. Absent unless asked for. */
  years?: YearCount[];
};

export type TopLostDiscsOptions = {
  /** Count "Destroyer, Star" and "destroyer" as the same model. */
  groupByDiscName?: boolean;
  /** Also break each model's total down by the year its discs were logged. */
  splitByYear?: boolean;
  limit?: number;
};

/**
 * Counts how often each disc model was lost, most-lost first.
 *
 * Without `groupByDiscName` the stored string is the model, so "Destroyer, Star"
 * and "Destroyer, Halo" are two entries. With it, everything from the first
 * comma onwards is dropped as the plastic and the remainder is matched
 * case-insensitively, which is what folds the two into one "Destroyer".
 *
 * With `splitByYear` each entry also carries the same total broken down by the
 * year the disc was logged (`addedAt`), which is the only date on a disc that is
 * both populated everywhere and chronologically real — see the spec.
 */
export function getTopLostDiscsByDiscName(data: DiscDTO[], options: TopLostDiscsOptions = {}): DiscNameStat[] {
  const groups = new Map<string, { value: number; spellings: Map<string, number>; years: Map<number, number> }>();

  data.forEach((item: DiscDTO) => {
    const spelling = options.groupByDiscName ? getDiscModelName(item.discName) : item.discName;
    const key = options.groupByDiscName ? spelling.toLowerCase() : spelling;

    const group = groups.get(key) ?? {
      value: 0,
      spellings: new Map<string, number>(),
      years: new Map<number, number>(),
    };

    group.value += 1;
    group.spellings.set(spelling, (group.spellings.get(spelling) ?? 0) + 1);

    const year = toPlausibleYear(getAddedDate(item));

    if (year !== null) {
      group.years.set(year, (group.years.get(year) ?? 0) + 1);
    }

    groups.set(key, group);
  });

  const stats: DiscNameStat[] = [...groups.values()].map((group) => {
    const stat: DiscNameStat = { label: pickCommonestSpelling(group.spellings), value: group.value };

    return options.splitByYear ? { ...stat, years: toYearCounts(group.years) } : stat;
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
 * A model's year tallies, ascending.
 *
 * A disc whose `addedAt` is unreadable, or dated outside `toPlausibleYear`'s
 * bound, is counted in the model's total but in no year — the same rule the two
 * headline totals apply, so a stray date cannot draw a segment of its own. The
 * parts can therefore fall short of the total, and the chart draws that
 * shortfall as a shorter bar rather than hiding it.
 */
function toYearCounts(years: Map<number, number>): YearCount[] {
  return [...years.entries()].map(([year, value]) => ({ year, value })).sort((a, b) => a.year - b.year);
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

/** The date the disc was logged. Set on every row, including web-added ones. */
function getAddedDate(disc: DiscDTO): Date | null {
  return disc.addedAt ? toDayDate(disc.addedAt) : null;
}

/**
 * A disc's year, or null when it has no date or one nobody could have meant.
 *
 * The bound is 2000..next year. One live row's returned_to_owner_text begins
 * "1.5.1012" — a mistyped 2012 — and it has to be treated as undated by both
 * callers: if only the button list rejected it, the disc would drop out of
 * every year and out of the "Päivämäärä puuttuu" count too, and the years would
 * quietly stop adding up to the all-time total.
 */
function toPlausibleYear(date: Date | null): number | null {
  if (date === null) {
    return null;
  }

  const year = date.getFullYear();

  return year >= 2000 && year <= new Date().getFullYear() + 1 ? year : null;
}

/**
 * The day out of a stored date column, whatever shape it arrives in.
 *
 * The two columns are not the same PostgreSQL type: `returned_to_owner_date`
 * comes back as "2026-07-16" and `can_be_sold_or_donated_date` as
 * "2026-09-04T00:00:00". Reading the first ten characters covers both, and
 * parsing that as a local day rather than handing the whole string to `Date`
 * keeps a date from sliding to the previous day in a timezone behind UTC.
 */
function toDayDate(value: string): Date | null {
  return toDate(value.slice(0, 10), 'y-MM-dd');
}

function toDate(value: string, pattern: string): Date | null {
  const parsed = parse(value, pattern, new Date());

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Shared with the two disc sets above, so a breakdown can never be drawn from a
// different set of discs than the total printed over it.
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
