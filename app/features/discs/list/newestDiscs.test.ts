import { describe, expect, it } from 'vitest';

import { latestAddedDay, newestDiscIdsWithPhoneNumber, type DatedDisc } from './newestDiscs';

const TODAY = '2026-10-02';

function disc(externalId: string, addedAt: string, ownerPhoneNumber = '0401234567'): DatedDisc {
  return { externalId, addedAt, ownerPhoneNumber };
}

describe('latestAddedDay', () => {
  it('is the day of the most recently added disc', () => {
    const discs = [disc('a', '2026-09-30'), disc('b', '2026-10-01'), disc('c', '2026-09-01')];

    expect(latestAddedDay(discs, TODAY)).toBe('2026-10-01');
  });

  it('compares by day, ignoring any time part', () => {
    const discs = [disc('a', '2026-09-30T23:59:59'), disc('b', '2026-10-01T00:00:00')];

    expect(latestAddedDay(discs, TODAY)).toBe('2026-10-01');
  });

  it('never counts an undated disc', () => {
    const discs = [disc('a', ''), { externalId: 'b' }, disc('c', '2026-09-30')];

    expect(latestAddedDay(discs, TODAY)).toBe('2026-09-30');
  });

  it('skips a day after today, which can only be a mistyped date', () => {
    const discs = [disc('a', '2062-10-01'), disc('b', '2026-10-02'), disc('c', '2026-09-30')];

    expect(latestAddedDay(discs, TODAY)).toBe('2026-10-02');
  });

  it('is null for an empty list', () => {
    expect(latestAddedDay([], TODAY)).toBeNull();
  });
});

describe('newestDiscIdsWithPhoneNumber', () => {
  it('picks the discs added on the newest day, in the order given', () => {
    const discs = [disc('a', '2026-09-30'), disc('b', '2026-10-01'), disc('c', '2026-10-01'), disc('d', '2026-09-01')];

    expect(newestDiscIdsWithPhoneNumber(discs, '2026-10-01')).toEqual(['b', 'c']);
  });

  it('leaves out a newest disc with no phone number', () => {
    const discs = [disc('a', '2026-10-01'), disc('b', '2026-10-01', ''), disc('c', '2026-09-30')];

    expect(newestDiscIdsWithPhoneNumber(discs, '2026-10-01')).toEqual(['a']);
  });

  it('does not reach back a day when none of the newest has a number', () => {
    const discs = [disc('a', '2026-10-01', ''), disc('b', '2026-09-30')];

    expect(newestDiscIdsWithPhoneNumber(discs, '2026-10-01')).toEqual([]);
  });

  it('compares by day, ignoring any time part', () => {
    const discs = [
      disc('a', '2026-10-01T00:00:00'),
      disc('b', '2026-10-01T23:59:59'),
      disc('c', '2026-09-30T23:59:59'),
    ];

    expect(newestDiscIdsWithPhoneNumber(discs, '2026-10-01')).toEqual(['a', 'b']);
  });

  it('leaves out a disc with no external id, which cannot be selected', () => {
    const discs = [{ addedAt: '2026-10-01', ownerPhoneNumber: '0401234567' }, disc('b', '2026-10-01')];

    expect(newestDiscIdsWithPhoneNumber(discs, '2026-10-01')).toEqual(['b']);
  });

  it('finds nothing when there is no newest day', () => {
    expect(newestDiscIdsWithPhoneNumber([disc('a', '')], null)).toEqual([]);
  });

  // The newest day is the whole list's, the discs to tick are the shown ones:
  // a filter narrows which newest discs are ticked, never which day is newest.
  it('ticks nothing when a filter hides every disc of the newest day', () => {
    const listed = [disc('a', '2026-10-01'), disc('b', '2026-09-01')];
    const shown = [listed[1]];

    expect(newestDiscIdsWithPhoneNumber(shown, latestAddedDay(listed, TODAY))).toEqual([]);
  });

  it('ticks only the shown discs of the newest day when a filter hides some', () => {
    const listed = [disc('a', '2026-10-01'), disc('b', '2026-10-01'), disc('c', '2026-09-01')];
    const shown = [listed[1], listed[2]];

    expect(newestDiscIdsWithPhoneNumber(shown, latestAddedDay(listed, TODAY))).toEqual(['b']);
  });
});
