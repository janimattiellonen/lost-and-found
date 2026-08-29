import { describe, expect, it } from 'vitest';

import { isExternalId, toInsertRows } from './discs.server';

const disc = { internalDiscId: null, discName: 'Destroyer, Star', discColour: 'Punainen', clubId: 2 };

describe('toInsertRows', () => {
  /**
   * postgrest-js derives the insert's `columns=` parameter from Object.keys(),
   * so a key held at undefined becomes a column PostgREST inserts NULL into.
   * That is what made an id-less insert fail the id NOT NULL constraint.
   */
  it('carries no key with an undefined value', () => {
    const [row] = toInsertRows([disc], 2, '2026-08-29');

    expect(Object.entries(row).filter(([, value]) => value === undefined)).toEqual([]);
  });

  it.each(['id', 'created_at', 'updated_at'])('leaves %s to the database', (column) => {
    expect(Object.keys(toInsertRows([disc], 2, '2026-08-29')[0])).not.toContain(column);
  });

  it('sends internal_disc_id as an explicit null', () => {
    const [row] = toInsertRows([disc], 2, '2026-08-29');

    expect(row).toHaveProperty('internal_disc_id', null);
  });

  it('gives every disc its own external id', () => {
    const rows = toInsertRows([disc, disc], 2, '2026-08-29');

    expect(rows[0].external_id).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(rows[0].external_id).not.toBe(rows[1].external_id);
  });

  it('files the batch under the given club and date', () => {
    expect(toInsertRows([disc], 7, '2026-08-29')[0]).toMatchObject({
      club_id: 7,
      added_at: '2026-08-29',
      is_returned_to_owner: false,
      can_be_sold_or_donated: false,
    });
  });

  it("keeps a disc's own added_at when it has one", () => {
    expect(toInsertRows([{ ...disc, addedAt: '2026-01-15' }], 2, '2026-08-29')[0].added_at).toBe('2026-01-15');
  });
});

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
