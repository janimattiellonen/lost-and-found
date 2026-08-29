import { describe, expect, it } from 'vitest';

import { toInsertRows } from './discs.server';

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
