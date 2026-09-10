import { describe, expect, it } from 'vitest';

import { retrievalErrandLabel, retrievalErrandMethod, toRetrievalErrand } from './retrievalErrand';
import { RetrievalMethod } from './retrievalMethod';

describe('retrievalErrandLabel', () => {
  it.each([
    [RetrievalMethod.ByMail, 'Postitus'],
    [RetrievalMethod.PickedUp, 'Nouto (minulta)'],
  ])('says what the owner asked for when the disc goes back to them: %i', (method, label) => {
    expect(retrievalErrandLabel({ kind: 'to-owner', method })).toBe(label);
  });

  it('says what is to happen to a disc the club is keeping', () => {
    expect(retrievalErrandLabel({ kind: 'kept-by-club' })).toBe('Myyntiin tai lahjoitukseen');
  });
});

describe('toRetrievalErrand', () => {
  it.each([RetrievalMethod.ByMail, RetrievalMethod.PickedUp])('reads %i as the method the owner asked for', (value) => {
    expect(toRetrievalErrand(value)).toEqual({ kind: 'to-owner', method: value });
  });

  it('reads a missing method as the disc the club is keeping', () => {
    expect(toRetrievalErrand(null)).toEqual({ kind: 'kept-by-club' });
  });

  it.each([2, -1, 7])('reads the impossible %i the same way, rather than as a method', (value) => {
    expect(toRetrievalErrand(value)).toEqual({ kind: 'kept-by-club' });
  });
});

describe('retrievalErrandMethod', () => {
  it('offers the method to preselect for a disc going back to its owner', () => {
    expect(retrievalErrandMethod({ kind: 'to-owner', method: RetrievalMethod.ByMail })).toBe(RetrievalMethod.ByMail);
  });

  it.each([
    ['a disc the club is keeping', { kind: 'kept-by-club' } as const],
    ['a disc that is not on the list at all', null],
  ])('has nothing to preselect for %s', (_name, errand) => {
    expect(retrievalErrandMethod(errand)).toBeNull();
  });
});
