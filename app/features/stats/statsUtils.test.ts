import { describe, expect, it } from 'vitest';

import {
  filterDiscsByYear,
  getDisposalDate,
  getDisposalMethodCounts,
  getReturnDate,
  getReturnMethodCounts,
  getDefaultYear,
  offersAllYears,
  getEarliestDate,
  getSelectedYear,
  getStatsYears,
  getTopLostDiscsByDiscName,
  getAddedDiscCountByMonth,
  toMonthAndYearKey,
  toMonthOfYearRow,
  mapBarData,
} from './statsUtils';
import { DisposalMethod, ReturnMethod } from '~/discMethods';
import type { DiscDTO } from '~/types';

function disc(fields: Partial<DiscDTO>): DiscDTO {
  return { internalDiscId: null, discName: 'Destroyer', discColour: '', clubId: 1, ...fields };
}

function discs(...names: string[]): DiscDTO[] {
  return names.map((discName) => ({ internalDiscId: null, discName, discColour: '', clubId: 1 }));
}

describe('getDisposalMethodCounts', () => {
  it('splits the released discs by method', () => {
    const counts = getDisposalMethodCounts([
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
    ]);

    expect(counts).toEqual([
      { label: 'Myydään', value: 1 },
      { label: 'Lahjoitetaan', value: 2 },
    ]);
  });

  it('counts a disc with no method under "Ei kirjattu"', () => {
    const counts = getDisposalMethodCounts([
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: null }),
      disc({ canBeSoldOrDonated: true }),
    ]);

    expect(counts).toEqual([
      { label: 'Myydään', value: 1 },
      { label: 'Lahjoitetaan', value: 0 },
      { label: 'Ei kirjattu', value: 2 },
    ]);
  });

  it('ignores discs the club has not released', () => {
    const counts = getDisposalMethodCounts([
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: false, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
      disc({}),
    ]);

    expect(counts).toEqual([
      { label: 'Myydään', value: 1 },
      { label: 'Lahjoitetaan', value: 0 },
    ]);
  });

  it('adds up to the headline count it sits under', () => {
    const data = [
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
      disc({ canBeSoldOrDonated: true }),
      disc({ canBeSoldOrDonated: false }),
    ];

    const total = getDisposalMethodCounts(data).reduce((sum, count) => sum + count.value, 0);

    expect(total).toBe(data.filter((item) => item.canBeSoldOrDonated).length);
  });
});

describe('getReturnMethodCounts', () => {
  it('splits the returned discs by method', () => {
    const counts = getReturnMethodCounts([
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.ByMail }),
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.PickedUp }),
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.PickedUp }),
    ]);

    expect(counts).toEqual([
      { label: 'Postitettu', value: 1 },
      { label: 'Noudettu', value: 2 },
    ]);
  });

  it('counts a returned disc with no method under "Ei kirjattu"', () => {
    const counts = getReturnMethodCounts([
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.ByMail }),
      disc({ isReturnedToOwner: true, returnMethod: null }),
    ]);

    expect(counts).toEqual([
      { label: 'Postitettu', value: 1 },
      { label: 'Noudettu', value: 0 },
      { label: 'Ei kirjattu', value: 1 },
    ]);
  });

  it('ignores discs that never went back', () => {
    const counts = getReturnMethodCounts([
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.ByMail }),
      disc({ isReturnedToOwner: false, returnMethod: ReturnMethod.PickedUp }),
    ]);

    expect(counts).toEqual([
      { label: 'Postitettu', value: 1 },
      { label: 'Noudettu', value: 0 },
    ]);
  });

  it('leaves out "Ei kirjattu" when every disc has a method', () => {
    const counts = getReturnMethodCounts([disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.PickedUp })]);

    expect(counts.map((count) => count.label)).toEqual(['Postitettu', 'Noudettu']);
  });

  it('shows both methods at zero when nothing has been returned', () => {
    expect(getReturnMethodCounts([disc({ isReturnedToOwner: false })])).toEqual([
      { label: 'Postitettu', value: 0 },
      { label: 'Noudettu', value: 0 },
    ]);
  });
});

describe('getTopLostDiscsByDiscName', () => {
  it('counts the exact stored string when grouping is off', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer, Star', 'Destroyer, Star', 'Destroyer, Halo'));

    expect(stats).toEqual([
      { label: 'Destroyer, Star', value: 2 },
      { label: 'Destroyer, Halo', value: 1 },
    ]);
  });

  it('drops the plastic after the comma when grouping is on', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer, Star', 'Destroyer, Halo', 'Destroyer'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([{ label: 'Destroyer', value: 3 }]);
  });

  it('ignores case when grouping', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer', 'destroyer', 'DEstroyer', 'destroyer, Star'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([{ label: 'destroyer', value: 4 }]);
  });

  it('labels a group with its commonest spelling', () => {
    const stats = getTopLostDiscsByDiscName(discs('DEstroyer', 'Destroyer', 'Destroyer, Star'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([{ label: 'Destroyer', value: 3 }]);
  });

  it('accepts a full stop where the comma was meant', () => {
    const stats = getTopLostDiscsByDiscName(discs('Essence, NEO', 'Essence. NEO'), { groupByDiscName: true });

    expect(stats).toEqual([{ label: 'Essence', value: 2 }]);
  });

  it('keeps a two-word mould whole', () => {
    const stats = getTopLostDiscsByDiscName(discs('Night Trooper', 'Night  Trooper', 'Sea Serpent'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([
      { label: 'Night Trooper', value: 2 },
      { label: 'Sea Serpent', value: 1 },
    ]);
  });

  it('leaves a plastic written without a comma as its own model', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer', 'Destroyer Star'), { groupByDiscName: true });

    expect(stats).toEqual([
      { label: 'Destroyer', value: 1 },
      { label: 'Destroyer Star', value: 1 },
    ]);
  });

  it('keeps the original text when there is nothing before the separator', () => {
    const stats = getTopLostDiscsByDiscName(discs(', Star'), { groupByDiscName: true });

    expect(stats).toEqual([{ label: ', Star', value: 1 }]);
  });

  it('takes the most-lost models up to the limit', () => {
    const stats = getTopLostDiscsByDiscName(discs('Wraith', 'Destroyer', 'Destroyer', 'Buzzz'), { limit: 2 });

    expect(stats).toEqual([
      { label: 'Destroyer', value: 2 },
      { label: 'Wraith', value: 1 },
    ]);
  });
});

describe('getReturnDate', () => {
  it('reads the column when the admin tool wrote one', () => {
    expect(getReturnDate(disc({ returnedToOwnerDate: '2025-03-09' }))?.getFullYear()).toBe(2025);
  });

  // returned_to_owner_date comes back as a plain day, and the disposal column
  // as a timestamp; both have to read as the day the admin picked.
  it('reads the day, not the day before, from a plain date', () => {
    expect(getReturnDate(disc({ returnedToOwnerDate: '2026-07-16' }))?.getDate()).toBe(16);
  });

  it('falls back to the leading date of a note copied from the Google Sheet', () => {
    const date = getReturnDate(disc({ returnedToOwnerText: '29.8.2026 (Janimatti), postitettu' }));

    expect(date?.getFullYear()).toBe(2026);
  });

  it('is null when the note begins with something other than a date', () => {
    expect(getReturnDate(disc({ returnedToOwnerText: 'noudettu 29.8.2026' }))).toBeNull();
  });
});

describe('getDisposalDate', () => {
  it('is null on the rows the Google Sheet import left empty', () => {
    expect(getDisposalDate(disc({ canBeSoldOrDonated: true }))).toBeNull();
  });

  it('reads the column when it is set', () => {
    expect(getDisposalDate(disc({ canBeSoldOrDonatedDate: '2026-01-04' }))?.getFullYear()).toBe(2026);
  });

  it('reads the timestamp shape the column actually returns', () => {
    const date = getDisposalDate(disc({ canBeSoldOrDonatedDate: '2026-09-04T00:00:00' }));

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getDate()).toBe(4);
  });
});

describe('filterDiscsByYear', () => {
  const discsOfSeveralYears = [
    disc({ returnedToOwnerDate: '2024-05-01' }),
    disc({ returnedToOwnerDate: '2025-05-01' }),
    disc({ returnedToOwnerDate: '2025-11-30' }),
    disc({}),
    disc({}),
  ];

  const returns = { discs: discsOfSeveralYears, getDate: getReturnDate };

  it('keeps every disc and reports no gap under "all"', () => {
    expect(filterDiscsByYear(returns, 'all')).toEqual({ discs: discsOfSeveralYears, undated: 0 });
  });

  it('keeps only the discs dated in the chosen year', () => {
    expect(filterDiscsByYear(returns, 2025).discs).toHaveLength(2);
  });

  it('reports the undated discs rather than dropping them silently', () => {
    expect(filterDiscsByYear(returns, 2024).undated).toBe(2);
  });

  it('reports the same gap whichever year is chosen', () => {
    expect(filterDiscsByYear(returns, 2026)).toEqual({ discs: [], undated: 2 });
  });

  it('counts a disc dated 1012 as undated, so the years still add up', () => {
    const mistyped = {
      discs: [disc({ returnedToOwnerText: '1.5.1012 (Janimatti), noudettu' })],
      getDate: getReturnDate,
    };

    expect(filterDiscsByYear(mistyped, 2012)).toEqual({ discs: [], undated: 1 });
  });

  it('leaves no disc in neither a year nor the undated count', () => {
    const all = filterDiscsByYear(returns, 'all').discs.length;
    const years = [2024, 2025].reduce((total, year) => total + filterDiscsByYear(returns, year).discs.length, 0);

    expect(years + filterDiscsByYear(returns, 2024).undated).toBe(all);
  });
});

describe('getStatsYears', () => {
  it('lists only the years this total has data for, ascending', () => {
    const returns = {
      discs: [disc({ returnedToOwnerDate: '2026-01-04' }), disc({ returnedToOwnerDate: '2024-05-01' })],
      getDate: getReturnDate,
    };

    expect(getStatsYears(returns)).toEqual([2024, 2026]);
  });

  // The two totals reach back to different places, so each gets its own list:
  // the disposal date was first recorded in September 2026, while the returns
  // go back to 2024 through the Google Sheet notes.
  it('does not offer a year the total itself has no disc in', () => {
    const disposals = { discs: [disc({ canBeSoldOrDonatedDate: '2026-09-01T00:00:00' })], getDate: getDisposalDate };

    expect(getStatsYears(disposals)).toEqual([2026]);
  });

  it('lists a year once however many discs carry it', () => {
    const discsOfOneYear = [disc({ returnedToOwnerDate: '2025-01-01' }), disc({ returnedToOwnerDate: '2025-06-01' })];

    expect(getStatsYears({ discs: discsOfOneYear, getDate: getReturnDate })).toEqual([2025]);
  });

  it('discards a mistyped year, so "1.5.1012" cannot become a button', () => {
    const mistyped = disc({ returnedToOwnerText: '1.5.1012 (Janimatti), noudettu' });

    expect(getStatsYears({ discs: [mistyped], getDate: getReturnDate })).toEqual([]);
  });

  it('is empty when nothing is dated', () => {
    expect(getStatsYears({ discs: [disc({})], getDate: getReturnDate })).toEqual([]);
  });
});

describe('getSelectedYear', () => {
  it('keeps a year the data still offers', () => {
    expect(getSelectedYear(2025, [2024, 2025, 2026])).toBe(2025);
  });

  it('keeps "Kaikki" while more than one year is offered', () => {
    expect(getSelectedYear('all', [2024, 2025])).toBe('all');
  });

  // The loader revalidates under an open page, so what was clicked against the
  // old data can name a year that no longer has a button.
  it('falls back when the selected year is no longer offered', () => {
    expect(getSelectedYear(2024, [2026])).toBe(2026);
  });

  it('drops "Kaikki" when the years shrink to one, rather than showing an unexplained total', () => {
    expect(getSelectedYear('all', [2026])).toBe(2026);
  });

  it('leaves "Kaikki" standing when nothing is dated and no button renders', () => {
    expect(getSelectedYear('all', [])).toBe('all');
  });
});

describe('getEarliestDate', () => {
  it('is the oldest dated disc in the total', () => {
    const returns = {
      discs: [
        disc({ returnedToOwnerDate: '2026-01-15' }),
        disc({ returnedToOwnerText: '3.9.2024 (Janimatti), noudettu' }),
        disc({}),
      ],
      getDate: getReturnDate,
    };

    const earliest = getEarliestDate(returns);

    expect(earliest?.getFullYear()).toBe(2024);
    expect(earliest?.getMonth()).toBe(8);
    expect(earliest?.getDate()).toBe(3);
  });

  it('ignores a date nobody could have meant, rather than reporting 1012', () => {
    const returns = {
      discs: [
        disc({ returnedToOwnerText: '1.5.1012 (Janimatti), noudettu' }),
        disc({ returnedToOwnerDate: '2025-02-02' }),
      ],
      getDate: getReturnDate,
    };

    expect(getEarliestDate(returns)?.getFullYear()).toBe(2025);
  });

  it('is null when the total has nothing dated', () => {
    expect(getEarliestDate({ discs: [disc({})], getDate: getReturnDate })).toBeNull();
  });
});

describe('getEarliestDate, scoped to what is on screen', () => {
  // The line under a total has to agree with the year selected beside it: on
  // 2025 the returns total must not inherit the 2024 date of a year it is no
  // longer showing.
  it('reports the oldest date among the discs actually shown', () => {
    const returns = {
      discs: [
        disc({ returnedToOwnerText: '3.9.2024 (Janimatti), noudettu' }),
        disc({ returnedToOwnerDate: '2025-04-02' }),
        disc({ returnedToOwnerDate: '2025-11-30' }),
      ],
      getDate: getReturnDate,
    };

    const shown = filterDiscsByYear(returns, 2025);
    const earliest = getEarliestDate({ discs: shown.discs, getDate: returns.getDate });

    expect(earliest?.getFullYear()).toBe(2025);
    expect(earliest?.getMonth()).toBe(3);
  });
});

describe('offersAllYears', () => {
  // The buttons, the starting selection and the drift check all ask this, so
  // the rule cannot be changed in one place and missed in the others.
  it('is false on a single year, where "Kaikki" would fold in the undated discs', () => {
    expect(offersAllYears([2026])).toBe(false);
  });

  it('is true once a total spans a second year', () => {
    expect(offersAllYears([2025, 2026])).toBe(true);
  });

  it('is false when nothing is dated', () => {
    expect(offersAllYears([])).toBe(false);
  });
});

describe('getDefaultYear', () => {
  it('starts on the only year there is, since "Kaikki" is not offered', () => {
    expect(getDefaultYear([2026])).toBe(2026);
  });

  it('starts on "Kaikki" once there is more than one year to compare', () => {
    expect(getDefaultYear([2024, 2025, 2026])).toBe('all');
  });

  it('falls back to "Kaikki" when no disc is dated and no button renders', () => {
    expect(getDefaultYear([])).toBe('all');
  });
});

describe('getTopLostDiscsByDiscName with splitByYear', () => {
  const logged = [
    disc({ discName: 'Destroyer, Star', addedAt: '2024-08-12T00:00:00+00:00' }),
    disc({ discName: 'Destroyer, Halo', addedAt: '2026-07-15T00:00:00+00:00' }),
    disc({ discName: 'destroyer', addedAt: '2026-02-01T00:00:00+00:00' }),
  ];

  it('leaves the years out unless they are asked for', () => {
    expect(getTopLostDiscsByDiscName(logged, { groupByDiscName: true })[0].years).toBeUndefined();
  });

  it('splits a grouped model by the year its discs were logged, ascending', () => {
    const [destroyer] = getTopLostDiscsByDiscName(logged, { groupByDiscName: true, splitByYear: true });

    expect(destroyer.value).toBe(3);
    expect(destroyer.years).toEqual([
      { year: 2024, value: 1 },
      { year: 2026, value: 2 },
    ]);
  });

  it('splits the exact stored names too, so the parts still sum to the bar', () => {
    const stats = getTopLostDiscsByDiscName(logged, { splitByYear: true });

    stats.forEach((stat) => {
      expect(stat.years?.reduce((total, year) => total + year.value, 0)).toBe(stat.value);
    });
  });

  it('counts a disc with no addedAt in the total but in no year', () => {
    const [stat] = getTopLostDiscsByDiscName([...logged, disc({ discName: 'Destroyer' })], {
      groupByDiscName: true,
      splitByYear: true,
    });

    expect(stat.value).toBe(4);
    expect(stat.years?.reduce((total, year) => total + year.value, 0)).toBe(3);
  });

  // The same bound the two headline totals apply, so a stray added_at cannot
  // draw a segment of its own.
  it('gives an implausibly dated disc no year of its own', () => {
    const [stat] = getTopLostDiscsByDiscName(
      [...logged, disc({ discName: 'Destroyer', addedAt: '1012-08-12T00:00:00+00:00' })],
      { groupByDiscName: true, splitByYear: true },
    );

    expect(stat.value).toBe(4);
    expect(stat.years?.map((year) => year.year)).toEqual([2024, 2026]);
  });
});

describe('getAddedDiscCountByMonth', () => {
  const returnedOn = (date: string): DiscDTO =>
    disc({ isReturnedToOwner: true, returnedToOwnerDate: date, returnedToOwnerText: null });

  it('gives each month of each year its own bar', () => {
    const counted = getAddedDiscCountByMonth(
      [returnedOn('2025-07-04'), returnedOn('2025-07-20'), returnedOn('2026-07-11')],
      toMonthAndYearKey,
      getReturnDate,
    );

    expect(counted.map((item) => item.amount)).toEqual([2, 1]);
  });

  it('keeps a bar whose separator is 0 — January, under a bare month number', () => {
    const counted = getAddedDiscCountByMonth([returnedOn('2026-01-09')], (date) => date.getMonth(), getReturnDate);

    expect(counted.map((item) => item.amount)).toEqual([1]);
  });

  it('leaves out a date nobody could have meant', () => {
    const counted = getAddedDiscCountByMonth(
      [returnedOn('2026-07-11'), disc({ isReturnedToOwner: true, returnedToOwnerText: '22.7.202' })],
      toMonthAndYearKey,
      getReturnDate,
    );

    expect(counted.map((item) => item.amount)).toEqual([1]);
  });

  it('sorts the bars oldest first, and labels each month under its year', () => {
    const counted = getAddedDiscCountByMonth(
      [returnedOn('2026-01-09'), returnedOn('2025-12-24'), returnedOn('2025-01-02')],
      toMonthAndYearKey,
      getReturnDate,
    );

    expect(mapBarData(counted, toMonthOfYearRow).map(({ label, group }) => `${group} ${label}`)).toEqual([
      '2025 tammi',
      '2025 joulu',
      '2026 tammi',
    ]);
  });
});
