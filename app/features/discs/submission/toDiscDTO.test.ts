import { describe, expect, it } from 'vitest';

import { parseDiscText } from '~/features/discs/submission/parser/parseDiscText';

import { toSubmission } from './submitDiscs';
import { MAX_BATCH_SIZE, parseBatch, toDiscDTO, toDiscName } from './toDiscDTO';

const submission = (text: string, course: string | null = null) => toSubmission({ ...parseDiscText(text), course });

/** The courses the club in these tests files discs under. */
const COURSES = ['Oittaa', 'Äijänpelto'];

describe('toDiscName', () => {
  it('writes the name and plastic the way the sheet does', () => {
    expect(toDiscName(submission('Star Destroyer punainen'))).toBe('Destroyer, Star');
  });

  it('leaves out a missing plastic, and the comma with it', () => {
    expect(toDiscName(submission('Mako3 keltainen'))).toBe('Mako3');
  });

  it('falls back to the plastic alone when the disc is unnamed', () => {
    expect(toDiscName({ discName: null, plastic: 'Star' })).toBe('Star');
  });
});

describe('toDiscDTO', () => {
  it('maps a parsed disc onto the persisted fields', () => {
    expect(toDiscDTO(submission('Star Destroyer punainen 050 123 4567 Steve D.'), 2)).toEqual({
      internalDiscId: null,
      discName: 'Destroyer, Star',
      discColour: 'Punainen',
      discManufacturer: 'Innova',
      ownerName: 'Steve D.',
      ownerPhoneNumber: '0501234567',
      course: null,
      clubId: 2,
    });
  });

  it('leaves the identifiers to the model', () => {
    const dto = toDiscDTO(submission('Mako3 keltainen'), 2);

    expect(dto.externalId).toBeUndefined();
    expect(dto.internalDiscId).toBeNull();
    expect(dto.addedAt).toBeUndefined();
  });

  it('files the disc under the club it was given', () => {
    expect(toDiscDTO(submission('Mako3 keltainen'), 1).clubId).toBe(1);
  });

  it('carries the chosen course through', () => {
    expect(toDiscDTO(submission('Mako3 keltainen', 'Oittaa'), 1).course).toBe('Oittaa');
  });
});

describe('parseBatch', () => {
  it('accepts a well-formed batch', () => {
    expect(parseBatch({ discs: [submission('Mako3 keltainen')] }, COURSES)).toEqual({
      discs: [submission('Mako3 keltainen')],
    });
  });

  it('trims values and turns blanks into null', () => {
    const result = parseBatch({ discs: [{ discName: '  Mako3  ', ownerName: '   ' }] }, COURSES);

    expect(result).toMatchObject({ discs: [{ discName: 'Mako3', ownerName: null }] });
  });

  it.each<{ reason: string; body: unknown }>([
    { reason: 'a body that is not an object', body: null },
    { reason: 'a body with no discs array', body: {} },
    { reason: 'discs that is not an array', body: { discs: 'Mako3' } },
    { reason: 'an empty batch', body: { discs: [] } },
    { reason: 'a row that is not an object', body: { discs: [null] } },
    { reason: 'a field that is not a string', body: { discs: [{ discName: 42 }] } },
    { reason: 'a field over the length cap', body: { discs: [{ discName: 'M'.repeat(201) }] } },
    { reason: 'a row with no name or plastic', body: { discs: [{ colour: 'Punainen' }] } },
    { reason: 'a course this club does not have', body: { discs: [{ discName: 'Mako3', course: 'Tali' }] } },
  ])('rejects $reason', ({ body }) => {
    expect(parseBatch(body, COURSES)).toMatchObject({ error: expect.any(String) });
  });

  it('accepts a row with one of the club courses, and one with none', () => {
    const result = parseBatch({ discs: [submission('Mako3 keltainen', 'Äijänpelto'), submission('Mako3')] }, COURSES);

    expect(result).toMatchObject({ discs: [{ course: 'Äijänpelto' }, { course: null }] });
  });

  it('rejects a batch over the size cap', () => {
    const discs = Array.from({ length: MAX_BATCH_SIZE + 1 }, () => submission('Mako3 keltainen'));

    expect(parseBatch({ discs }, COURSES)).toMatchObject({ error: expect.stringContaining('Liian monta') });
  });
});
