import { describe, expect, it } from 'vitest';

import { parseDiscText } from '~/features/discParser/parseDiscText';

import { submitDiscs, toSubmission } from './submitDiscs';

describe('toSubmission', () => {
  it('keeps the fields the server needs and drops the rest', () => {
    const parsed = parseDiscText('Star Destroyer punainen 050 123 4567 Steve D.');

    expect(toSubmission(parsed)).toEqual({
      discName: 'Destroyer',
      plastic: 'Star',
      colour: 'Punainen',
      manufacturer: 'Innova',
      phoneNumber: '0501234567',
      ownerName: 'Steve D.',
    });
  });

  it('passes unidentified fields through as null', () => {
    expect(toSubmission(parseDiscText('Mako3 keltainen'))).toMatchObject({
      plastic: null,
      phoneNumber: null,
      ownerName: null,
    });
  });
});

describe('submitDiscs', () => {
  it('reports how many discs were saved', async () => {
    const result = await submitDiscs([toSubmission(parseDiscText('Mako3 keltainen'))]);

    expect(result).toEqual({ status: 'success', savedCount: 1 });
  });

  it('refuses an empty batch', async () => {
    expect(await submitDiscs([])).toMatchObject({ status: 'error' });
  });

  it('can be asked to fail, so the error path is reachable', async () => {
    const result = await submitDiscs([toSubmission(parseDiscText('Mako3 keltainen'))], { simulate: 'error' });

    expect(result.status).toBe('error');
  });
});
