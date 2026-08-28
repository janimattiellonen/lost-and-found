import { describe, expect, it } from 'vitest';

import { COLOUR, DISC_NAME, PLASTIC, buildDictionary, lookup } from './dictionary';

const dictionary = buildDictionary();

describe('buildDictionary', () => {
  it('indexes every vendored manufacturer', () => {
    expect(dictionary.manufacturers).toHaveLength(23);
    expect(dictionary.manufacturers).toContain('Innova');
    expect(dictionary.manufacturers).toContain('Kastaplast');
  });

  it('exposes the longest entry length so the scanner knows its n-gram window', () => {
    expect(dictionary.maxTokens).toBeGreaterThanOrEqual(3);
  });
});

describe('lookup', () => {
  it('finds disc names and attributes them to a manufacturer', () => {
    expect(lookup(dictionary, 'mako3')).toEqual([{ kind: DISC_NAME, value: 'Mako3', manufacturer: 'Innova' }]);
  });

  it('finds plastics and attributes them to a manufacturer', () => {
    expect(lookup(dictionary, 'star')).toEqual([{ kind: PLASTIC, value: 'Star', manufacturer: 'Innova' }]);
  });

  it('is case insensitive', () => {
    expect(lookup(dictionary, 'DESTROYER')).toEqual([{ kind: DISC_NAME, value: 'Destroyer', manufacturer: 'Innova' }]);
  });

  it('finds multi-word plastics', () => {
    expect(lookup(dictionary, 'active premium')).toEqual([
      { kind: PLASTIC, value: 'Active Premium', manufacturer: 'Discmania' },
    ]);
  });

  it('finds colours, which belong to no manufacturer', () => {
    expect(lookup(dictionary, 'punainen')).toEqual([{ kind: COLOUR, value: 'Punainen', manufacturer: null }]);
  });

  it('finds multi-word colours', () => {
    expect(lookup(dictionary, 'vaalean sininen')).toEqual([
      { kind: COLOUR, value: 'Vaalean sininen', manufacturer: null },
    ]);
  });

  it('returns every candidate for a word that is both a disc name and a plastic', () => {
    const kinds = lookup(dictionary, 'eclipse').map((entry) => entry.kind);

    expect(kinds).toContain(DISC_NAME);
    expect(kinds).toContain(PLASTIC);
  });

  it('returns an empty list for unknown words', () => {
    expect(lookup(dictionary, 'kaljakori')).toEqual([]);
  });

  it('resolves aliases that are missing from the vendored data', () => {
    expect(lookup(dictionary, 'k1 line')).toEqual([{ kind: PLASTIC, value: 'K1 Line', manufacturer: 'Kastaplast' }]);
  });
});
