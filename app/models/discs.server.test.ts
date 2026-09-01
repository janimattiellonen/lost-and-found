import { describe, expect, it } from 'vitest';

import { toListedDiscs } from './discs.server';

const row = (overrides: Record<string, unknown> = {}) => ({
  external_id: '3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e',
  internal_disc_id: 12,
  disc_name: 'Destroyer, Star',
  disc_colour: 'Punainen',
  owner_name: 'Steve D.',
  owner_phone_number: '0501234567',
  club_id: 1,
  ...overrides,
});

describe('toListedDiscs', () => {
  describe('for a visitor who is not signed in', () => {
    it('cuts the phone number down to its last four digits', () => {
      expect(toListedDiscs([row()], false)[0].ownerPhoneNumber).toBe('4567');
    });

    it('never lets a full number through', () => {
      const rows = [row({ owner_phone_number: '+358501234567' }), row({ owner_phone_number: '0401112222' })];

      expect(toListedDiscs(rows, false).map((disc) => disc.ownerPhoneNumber)).toEqual(['4567', '2222']);
    });

    // Documents what the cut actually does rather than what it sounds like it
    // does: it takes the last four characters, so a number stored with spaces
    // or dashes keeps one. Pre-existing, and left alone here — the phone search
    // matches with endsWith, so such a disc is already unfindable by its last
    // four digits whether or not anyone is signed in.
    it('takes the last four characters, separators included', () => {
      expect(toListedDiscs([row({ owner_phone_number: '050-123 45 67' })], false)[0].ownerPhoneNumber).toBe('5 67');
    });

    it('leaves a disc with no phone number alone', () => {
      expect(toListedDiscs([row({ owner_phone_number: null })], false)[0].ownerPhoneNumber).toBeNull();
    });

    it('passes a number already at four digits through unchanged', () => {
      expect(toListedDiscs([row({ owner_phone_number: '4567' })], false)[0].ownerPhoneNumber).toBe('4567');
    });
  });

  describe('for a signed-in admin', () => {
    it('keeps the whole phone number', () => {
      expect(toListedDiscs([row()], true)[0].ownerPhoneNumber).toBe('0501234567');
    });

    it('still leaves a disc with no phone number alone', () => {
      expect(toListedDiscs([row({ owner_phone_number: null })], true)[0].ownerPhoneNumber).toBeNull();
    });
  });

  it('does not shorten the caller-held row, only the disc it returns', () => {
    const original = row();

    toListedDiscs([original], false);

    expect(original.owner_phone_number).toBe('0501234567');
  });

  it('maps the rest of the row the same way either way', () => {
    const [asPublic] = toListedDiscs([row()], false);
    const [asAdmin] = toListedDiscs([row()], true);

    expect({ ...asPublic, ownerPhoneNumber: null }).toEqual({ ...asAdmin, ownerPhoneNumber: null });
  });

  it('handles an empty list', () => {
    expect(toListedDiscs([], false)).toEqual([]);
  });
});
