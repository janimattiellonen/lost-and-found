import { describe, expect, it } from 'vitest';

import type { DiscDTO } from '~/types';
import { getDistinctCourses, toDiallablePhoneNumber } from '~/utils';

function disc(course?: string | null): DiscDTO {
  return { discName: 'Destroyer', course } as DiscDTO;
}

describe('getDistinctCourses', () => {
  it('returns each course once, in Finnish alphabetical order', () => {
    const discs = [disc('Äijänpelto'), disc('Oittaa'), disc('Äijänpelto')];

    expect(getDistinctCourses(discs)).toEqual(['Oittaa', 'Äijänpelto']);
  });

  it('leaves out discs with no course recorded', () => {
    const discs = [disc('Oittaa'), disc(''), disc(null), disc(undefined)];

    expect(getDistinctCourses(discs)).toEqual(['Oittaa']);
  });

  it('returns nothing for a club that records no course at all', () => {
    expect(getDistinctCourses([disc(null), disc(null)])).toEqual([]);
  });
});

describe('toDiallablePhoneNumber', () => {
  it('strips the grouping spaces an `sms:` target cannot take', () => {
    expect(toDiallablePhoneNumber('050 123 4567')).toBe('0501234567');
    expect(toDiallablePhoneNumber('+372 333 4444')).toBe('+3723334444');
  });

  it('leaves a number that was never grouped alone', () => {
    expect(toDiallablePhoneNumber('0501234567')).toBe('0501234567');
  });
});
