import { describe, expect, it } from 'vitest';

import { fieldNames, validateDiscEdit } from '~/features/discs/edit/discEdit';

const COURSES = ['Tali', 'Kivikko'];

/** The smallest valid submission: everything the form requires and nothing else. */
function form(fields: Partial<Record<keyof typeof fieldNames, string>> = {}): FormData {
  const data = new FormData();

  data.set(fieldNames.discName, 'Destroyer, Star');

  for (const [field, value] of Object.entries(fields)) {
    data.set(fieldNames[field as keyof typeof fieldNames], value);
  }

  return data;
}

describe('validateDiscEdit', () => {
  it('trims the text fields and stores an empty one as null', () => {
    const result = validateDiscEdit(form({ discName: '  Wraith  ', ownerName: '   ' }), COURSES);

    expect(result.errors).toBeUndefined();
    expect(result.values?.discName).toBe('Wraith');
    expect(result.values?.ownerName).toBeNull();
  });

  it('keeps an empty colour as a string, since the column is NOT NULL', () => {
    const result = validateDiscEdit(form({ discColour: '' }), COURSES);

    expect(result.values?.discColour).toBe('');
  });

  it('refuses an empty disc name', () => {
    const result = validateDiscEdit(form({ discName: '   ' }), COURSES);

    expect(result.errors?.discName).toBe('Kiekon nimi on pakollinen.');
  });

  it('refuses a field longer than the cap', () => {
    const result = validateDiscEdit(form({ ownerName: 'a'.repeat(201) }), COURSES);

    expect(result.errors?.ownerName).toContain('liian pitkä');
  });

  it('allows the note to run longer than the other fields', () => {
    const result = validateDiscEdit(form({ additionalInfo: 'a'.repeat(400) }), COURSES);

    expect(result.errors).toBeUndefined();
  });

  it('refuses a course this club does not collect from', () => {
    const result = validateDiscEdit(form({ course: 'Vuosaari' }), COURSES);

    expect(result.errors?.course).toBe('Tuntematon rata "Vuosaari".');
  });

  it('reads no course at all as null', () => {
    const result = validateDiscEdit(form({ course: '' }), COURSES);

    expect(result.values?.course).toBeNull();
  });

  it('keeps the date and method that come with a return', () => {
    const result = validateDiscEdit(
      form({ isReturnedToOwner: 'on', returnedToOwnerDate: '2026-09-01', returnMethod: '1' }),
      COURSES,
    );

    expect(result.values?.isReturnedToOwner).toBe(true);
    expect(result.values?.returnedToOwnerDate).toBe('2026-09-01');
    expect(result.values?.returnMethod).toBe(1);
  });

  it('requires a date while the return box is ticked', () => {
    const result = validateDiscEdit(form({ isReturnedToOwner: 'on' }), COURSES);

    expect(result.errors?.returnedToOwnerDate).toBe('Päivämäärä on pakollinen.');
  });

  it('refuses a date that is not a real day', () => {
    const result = validateDiscEdit(form({ isReturnedToOwner: 'on', returnedToOwnerDate: '2026-02-30' }), COURSES);

    expect(result.errors?.returnedToOwnerDate).toBe('Virheellinen päivämäärä.');
  });

  it('refuses a method outside the enum', () => {
    const result = validateDiscEdit(
      form({ isReturnedToOwner: 'on', returnedToOwnerDate: '2026-09-01', returnMethod: '7' }),
      COURSES,
    );

    expect(result.errors?.returnMethod).toBe('Virheellinen tapa.');
  });

  it('takes no method as the deliberate "not recorded"', () => {
    const result = validateDiscEdit(
      form({ isReturnedToOwner: 'on', returnedToOwnerDate: '2026-09-01', returnMethod: '' }),
      COURSES,
    );

    expect(result.values?.returnMethod).toBeNull();
  });

  // Unticking is how a disc comes back to the public list, so the date and the
  // method have to go with it rather than linger on the row.
  it('clears the date and method of a mark whose box is not ticked', () => {
    const result = validateDiscEdit(form({ returnedToOwnerDate: '2026-09-01', returnMethod: '1' }), COURSES);

    expect(result.values?.isReturnedToOwner).toBe(false);
    expect(result.values?.returnedToOwnerDate).toBeNull();
    expect(result.values?.returnMethod).toBeNull();
  });

  it('refuses a disc that is both returned and up for sale', () => {
    const result = validateDiscEdit(
      form({
        isReturnedToOwner: 'on',
        returnedToOwnerDate: '2026-09-01',
        canBeSoldOrDonated: 'on',
        canBeSoldOrDonatedDate: '2026-09-01',
      }),
      COURSES,
    );

    expect(result.errors?.form).toBe('Kiekko ei voi olla sekä palautettu että myytävissä tai lahjoitettavissa.');
  });

  it('leaves a phone number exactly as the club wrote it', () => {
    const result = validateDiscEdit(form({ ownerPhoneNumber: '050 123 4567 (äiti)' }), COURSES);

    expect(result.errors).toBeUndefined();
    expect(result.values?.ownerPhoneNumber).toBe('050 123 4567 (äiti)');
  });
});
