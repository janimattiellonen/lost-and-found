import { describe, expect, it } from 'vitest';

import { newestDiscIdsWithPhoneNumber, type DatedDisc } from './newestDiscs';

const TODAY = '2026-10-02';

function disc(externalId: string, addedAt: string, ownerPhoneNumber = '0401234567'): DatedDisc {
  return { externalId, addedAt, ownerPhoneNumber };
}

describe('newestDiscIdsWithPhoneNumber', () => {
  it('picks the discs added on the latest day, in the order given', () => {
    const discs = [disc('a', '2026-09-30'), disc('b', '2026-10-01'), disc('c', '2026-10-01'), disc('d', '2026-09-01')];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual(['b', 'c']);
  });

  it('leaves out a newest disc with no phone number', () => {
    const discs = [disc('a', '2026-10-01'), disc('b', '2026-10-01', ''), disc('c', '2026-09-30')];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual(['a']);
  });

  it('does not reach back a day when none of the newest has a number', () => {
    const discs = [disc('a', '2026-10-01', ''), disc('b', '2026-09-30')];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual([]);
  });

  it('compares by day, ignoring any time part', () => {
    const discs = [
      disc('a', '2026-10-01T00:00:00'),
      disc('b', '2026-10-01T23:59:59'),
      disc('c', '2026-09-30T23:59:59'),
    ];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual(['a', 'b']);
  });

  it('never counts an undated disc as newest', () => {
    const discs = [disc('a', ''), disc('b', '2026-09-30')];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual(['b']);
  });

  it('leaves out a disc with no external id, which cannot be selected', () => {
    const discs = [{ addedAt: '2026-10-01', ownerPhoneNumber: '0401234567' }, disc('b', '2026-10-01')];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual(['b']);
  });

  it('skips a day after today, which can only be a mistyped date', () => {
    const discs = [disc('a', '2062-10-01'), disc('b', '2026-10-02'), disc('c', '2026-09-30')];

    expect(newestDiscIdsWithPhoneNumber(discs, TODAY)).toEqual(['b']);
  });

  it('finds nothing in an empty list', () => {
    expect(newestDiscIdsWithPhoneNumber([], TODAY)).toEqual([]);
  });
});
