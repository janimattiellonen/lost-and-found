import { describe, expect, it } from 'vitest';

import { NO_CATEGORY, parseCategoryId } from './templateCategoryField';

describe('parseCategoryId', () => {
  it('reads a category id', () => {
    expect(parseCategoryId('7')).toBe(7);
  });

  it('reads "Ei kategoriaa" as no category', () => {
    expect(parseCategoryId(NO_CATEGORY)).toBeNull();
  });

  it('reads an absent field as no category', () => {
    expect(parseCategoryId(null)).toBeNull();
  });

  // The value reaches this both from a posted form and from the ?category=
  // parameter on the composer, so anything at all can be in it.
  it.each(['abc', '1.5', '-3', '0', ' ', '1; drop table'])('refuses %o', (value) => {
    expect(parseCategoryId(value)).toBeNull();
  });
});
