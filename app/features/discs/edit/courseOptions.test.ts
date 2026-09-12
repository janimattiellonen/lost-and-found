import { describe, expect, it } from 'vitest';

import { courseOptions } from '~/features/discs/edit/courseOptions';

describe('courseOptions', () => {
  it("offers the club's courses when the disc is filed under one of them", () => {
    expect(courseOptions(['Oittaa', 'Äijänpelto'], 'Oittaa')).toEqual(['Oittaa', 'Äijänpelto']);
  });

  it('offers the same when the disc has no course at all', () => {
    expect(courseOptions(['Oittaa', 'Äijänpelto'], null)).toEqual(['Oittaa', 'Äijänpelto']);
  });

  // The one that matters: without this the dropdown would show "no course" and
  // the next save would null a column nobody asked to change.
  it('keeps a stored course the club no longer collects from', () => {
    expect(courseOptions(['Oittaa'], 'Vanha rata')).toEqual(['Oittaa', 'Vanha rata']);
  });

  it('offers the stored course alone for a club that records no courses', () => {
    expect(courseOptions([], 'Tali')).toEqual(['Tali']);
  });

  it('offers nothing for a club with no courses and a disc with none', () => {
    expect(courseOptions([], null)).toEqual([]);
  });
});
