import { describe, expect, it } from 'vitest';

import type { DiscDTO } from '~/types';
import { formatPhoneNumber, getDistinctCourses } from '~/utils';

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

describe('formatPhoneNumber', () => {
  it('groups a full domestic number as prefix, three, four', () => {
    expect(formatPhoneNumber('0501234567')).toBe('050 123 4567');
    expect(formatPhoneNumber('0411234567')).toBe('041 123 4567');
  });

  it('keeps the four-digit tail when a digit too many was written down', () => {
    expect(formatPhoneNumber('05012345678')).toBe('050 1234 5678');
  });

  it('regroups a number that was entered with spaces of its own', () => {
    expect(formatPhoneNumber('041123 4567')).toBe('041 123 4567');
    expect(formatPhoneNumber('040 152 3455')).toBe('040 152 3455');
  });

  it('groups an international number after its country code', () => {
    expect(formatPhoneNumber('+3723334444')).toBe('+372 333 4444');
    expect(formatPhoneNumber('+3705551234')).toBe('+370 555 1234');
  });

  it('leaves a longer international number as entered', () => {
    // A country code is assumed to be three digits, so a Finnish number in
    // international form (+358 and nine more) and a Swedish one (+46 and ten
    // more) both fall outside what can be grouped without guessing where the
    // code ends. Neither appears in the data; both are shown as entered.
    expect(formatPhoneNumber('+358501234567')).toBe('+358501234567');
    expect(formatPhoneNumber('+467707587588')).toBe('+467707587588');
  });

  it('adds no country code to a number that has none', () => {
    expect(formatPhoneNumber('0501234567')).not.toContain('+');
  });

  it('leaves a number the club could not fully read exactly as entered', () => {
    expect(formatPhoneNumber('0401304???')).toBe('0401304???');
    expect(formatPhoneNumber('04?130570')).toBe('04?130570');
    expect(formatPhoneNumber('????2744')).toBe('????2744');
  });

  it('leaves a number that was never in Finnish form as entered', () => {
    expect(formatPhoneNumber('(116)930-6662')).toBe('(116)930-6662');
    expect(formatPhoneNumber('716-432-9056')).toBe('716-432-9056');
  });

  it('leaves a fragment too short to group as entered', () => {
    expect(formatPhoneNumber('045636157')).toBe('045636157');
    expect(formatPhoneNumber('54540077')).toBe('54540077');
    expect(formatPhoneNumber('2721812')).toBe('2721812');
    expect(formatPhoneNumber('2308')).toBe('2308');
  });

  it('leaves ten digits that are not a domestic number as entered', () => {
    expect(formatPhoneNumber('7164329056')).toBe('7164329056');
  });

  it('renders a missing number as nothing', () => {
    expect(formatPhoneNumber(null)).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
    expect(formatPhoneNumber('')).toBe('');
  });
});
