import { describe, expect, it } from 'vitest';

import { isExternalId, isIsoDate } from './validate';

describe('isExternalId', () => {
  it.each(['3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e', '3F8A1C2E-5B6D-4A7F-9C0E-1D2B3A4C5D6E', crypto.randomUUID()])(
    'accepts the uuid %s',
    (value) => {
      expect(isExternalId(value)).toBe(true);
    },
  );

  it.each([
    ['a number', 1],
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['a bare integer id', '42'],
    ['a truncated uuid', '3f8a1c2e-5b6d-4a7f-9c0e'],
    ['a uuid with trailing text', '3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e drop table'],
  ])('rejects %s', (_reason, value) => {
    expect(isExternalId(value)).toBe(false);
  });
});

describe('isIsoDate', () => {
  it.each(['2026-08-29', '2026-01-01', '2024-02-29'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each<[string, unknown]>([
    ['a Finnish date', '29.8.2026'],
    ['a day that does not exist', '2026-02-30'],
    ['a month that does not exist', '2026-13-01'],
    ['a non-leap 29 February', '2025-02-29'],
    ['a single-digit month', '2026-8-29'],
    ['a datetime', '2026-08-29T12:00:00Z'],
    ['a date with trailing text', '2026-08-29 postitettu'],
    ['a number', 20260829],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_reason, value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});
