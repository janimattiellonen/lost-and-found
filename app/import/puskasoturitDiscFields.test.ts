import { describe, expect, it } from 'vitest';

import { DisposalMethod } from '~/features/discs/disposal/disposalMethod';
import { ReturnMethod } from '~/features/discs/return/returnMethod';
import type { DiscDTO } from '~/types';
import {
  DISPOSAL_METHOD_DONATED,
  DISPOSAL_METHOD_SOLD,
  RETURN_METHOD_BY_MAIL,
  RETURN_METHOD_PICKED_UP,
  normalizeCourse,
  parseDisposalMethod,
  parseNoteDate,
  parseReturnMethod,
  toDiscRow,
} from '~/import/puskasoturitDiscFields';

// The import script cannot import the enums themselves (see the module docs),
// so this is what keeps the two copies from drifting apart.
describe('method numbers', () => {
  it('match the enums the rest of the app uses', () => {
    expect(RETURN_METHOD_BY_MAIL).toBe(ReturnMethod.ByMail);
    expect(RETURN_METHOD_PICKED_UP).toBe(ReturnMethod.PickedUp);
    expect(DISPOSAL_METHOD_SOLD).toBe(DisposalMethod.Sold);
    expect(DISPOSAL_METHOD_DONATED).toBe(DisposalMethod.Donated);
  });
});

describe('normalizeCourse', () => {
  it('keeps a correctly spelled course as it is', () => {
    expect(normalizeCourse('Oittaa')).toBe('Oittaa');
    expect(normalizeCourse('Äijänpelto')).toBe('Äijänpelto');
  });

  it('folds the misspellings found in the sheet into one name', () => {
    expect(normalizeCourse('Oiittaa')).toBe('Oittaa');
    expect(normalizeCourse('ÄIjänpelto')).toBe('Äijänpelto');
    expect(normalizeCourse(' oittaa ')).toBe('Oittaa');
  });

  it('treats a missing or empty course as none', () => {
    expect(normalizeCourse('')).toBeNull();
    expect(normalizeCourse('   ')).toBeNull();
    expect(normalizeCourse(null)).toBeNull();
    expect(normalizeCourse(undefined)).toBeNull();
  });

  it('passes an unknown course through rather than dropping it', () => {
    expect(normalizeCourse('Puolarmaari')).toBe('Puolarmaari');
  });
});

describe('parseNoteDate', () => {
  it('reads the date out of a return note', () => {
    expect(parseNoteDate('14.5.2026 (Janimatti), noudettu')).toBe('2026-05-14');
    expect(parseNoteDate('7.5.2026 (Janimatti), postitettu')).toBe('2026-05-07');
  });

  it('finds a date given in parentheses', () => {
    expect(parseNoteDate('Viety Äpeen (10.4.2026)')).toBe('2026-04-10');
  });

  it('rejects a mistyped year instead of guessing at it', () => {
    expect(parseNoteDate('17.7.10126 (Janimatti), noudettu')).toBeNull();
  });

  it('rejects a day that does not exist', () => {
    expect(parseNoteDate('31.2.2026')).toBeNull();
  });

  it('returns null for a note with no date', () => {
    expect(parseNoteDate('Palautettu')).toBeNull();
    expect(parseNoteDate('')).toBeNull();
    expect(parseNoteDate(null)).toBeNull();
  });
});

describe('parseReturnMethod', () => {
  it('recognises the two methods', () => {
    expect(parseReturnMethod('14.5.2026 (Janimatti), noudettu')).toBe(RETURN_METHOD_PICKED_UP);
    expect(parseReturnMethod('7.5.2026 (Janimatti), postitettu')).toBe(RETURN_METHOD_BY_MAIL);
  });

  it('still recognises the typos in the sheet', () => {
    expect(parseReturnMethod('6.8.2026 (Janimatti), noudwttu')).toBe(RETURN_METHOD_PICKED_UP);
    expect(parseReturnMethod('26.8.2026 (Janimatti), kaveri nouti')).toBe(RETURN_METHOD_PICKED_UP);
  });

  it('leaves a note that names no method unanswered', () => {
    expect(parseReturnMethod('Palautettu')).toBeNull();
    expect(parseReturnMethod('Viety Taliin')).toBeNull();
    expect(parseReturnMethod(null)).toBeNull();
  });
});

describe('parseDisposalMethod', () => {
  it('recognises the two methods', () => {
    expect(parseDisposalMethod('Myydään')).toBe(DISPOSAL_METHOD_SOLD);
    expect(parseDisposalMethod('Lahjoitetaan')).toBe(DISPOSAL_METHOD_DONATED);
    expect(parseDisposalMethod('Lahjoitettu')).toBe(DISPOSAL_METHOD_DONATED);
  });

  it('still recognises the typo in the sheet', () => {
    expect(parseDisposalMethod('Muyydään')).toBe(DISPOSAL_METHOD_SOLD);
  });

  it('treats a discarded disc as neither sold nor donated', () => {
    expect(parseDisposalMethod('Roskiin, koiran purema')).toBeNull();
    expect(parseDisposalMethod(null)).toBeNull();
  });
});

describe('toDiscRow', () => {
  const disc: DiscDTO = {
    discName: 'Destroyer',
    discManufacturer: 'Innova',
    discColour: 'punainen',
    ownerName: 'Matti M.',
    ownerPhoneNumber: '0401234567',
    additionalInfo: '',
    addedAt: '2026-01-03',
    isReturnedToOwner: true,
    returnedToOwnerText: '14.5.2026 (Janimatti), noudettu',
    canBeSoldOrDonated: false,
    canBeSoldOrDonatedText: '',
    course: 'Oiittaa',
    internalDiscId: 3802,
    clubId: 1,
  } as DiscDTO;

  it('maps the disc onto the database columns, notes included', () => {
    const row = toDiscRow(disc);

    expect(row).toMatchObject({
      internal_disc_id: 3802,
      club_id: 1,
      disc_name: 'Destroyer',
      course: 'Oittaa',
      added_at: '2026-01-03',
      is_returned_to_owner: true,
      returned_to_owner_text: '14.5.2026 (Janimatti), noudettu',
      returned_to_owner_date: '2026-05-14',
      return_method: RETURN_METHOD_PICKED_UP,
      can_be_sold_or_donated: false,
      can_be_sold_or_donated_text: null,
      can_be_sold_or_donated_date: null,
      can_be_sold_or_donated_method: null,
    });
  });

  it('gives every disc its own external id', () => {
    expect(toDiscRow(disc).external_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(toDiscRow(disc).external_id).not.toBe(toDiscRow(disc).external_id);
  });

  it('turns an internal disc id that arrives as sheet text into a number', () => {
    expect(toDiscRow({ ...disc, internalDiscId: '3802' as unknown as number }).internal_disc_id).toBe(3802);
  });
});
