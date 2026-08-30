import { describe, expect, it } from 'vitest';

import { parseSheetDate } from '~/import/PuskaSoturitImporter';

describe('parseSheetDate', () => {
  it('reads the sheet dd/MM/y format', () => {
    expect(parseSheetDate('03/01/2026')).toBe('2026-01-03');
    expect(parseSheetDate('21/07/2026')).toBe('2026-07-21');
  });

  it('returns null for a cell that is not a date', () => {
    // One row in the sheet currently reads "9248"; this used to throw and take
    // the whole import down.
    expect(parseSheetDate('9248')).toBeNull();
    expect(parseSheetDate('ei tiedossa')).toBeNull();
  });

  it('returns null for an empty cell', () => {
    expect(parseSheetDate('')).toBeNull();
    expect(parseSheetDate(null)).toBeNull();
    expect(parseSheetDate(undefined)).toBeNull();
  });
});
