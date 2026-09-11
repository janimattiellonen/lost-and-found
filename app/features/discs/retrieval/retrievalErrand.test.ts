import { describe, expect, it } from 'vitest';

import {
  retrievalErrandLabel,
  retrievalErrandMethod,
  supersededRequestLabel,
  toListedErrand,
  toRetrievalErrand,
} from './retrievalErrand';
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

  it('sends the admin to the messages rather than guessing at a row it cannot read', () => {
    expect(retrievalErrandLabel({ kind: 'unclear' })).toBe('Noutotapa epäselvä – tarkista viestit');
  });
});

describe('toRetrievalErrand', () => {
  it.each([RetrievalMethod.ByMail, RetrievalMethod.PickedUp])('reads %i as the method the owner asked for', (value) => {
    expect(toRetrievalErrand(value)).toEqual({ kind: 'to-owner', method: value });
  });

  it('reads a missing method as the disc the club is keeping', () => {
    expect(toRetrievalErrand(null)).toEqual({ kind: 'kept-by-club' });
  });

  it.each([2, -1, 7])('refuses to guess at the impossible %i', (value) => {
    expect(toRetrievalErrand(value)).toEqual({ kind: 'unclear' });
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

describe('toListedErrand', () => {
  it('shows what the owner asked for while the disc is still going back to them', () => {
    expect(toListedErrand(RetrievalMethod.ByMail, false)).toEqual({
      errand: { kind: 'to-owner', method: RetrievalMethod.ByMail },
      superseded: null,
    });
  });

  it('names the request the club overruled when it decided to keep the disc', () => {
    expect(toListedErrand(RetrievalMethod.ByMail, true)).toEqual({
      errand: { kind: 'kept-by-club' },
      superseded: { kind: 'to-owner', method: RetrievalMethod.ByMail },
    });
  });

  it('keeps an unreadable request as one, rather than losing it to the disposal', () => {
    expect(toListedErrand(7, true)).toEqual({ errand: { kind: 'kept-by-club' }, superseded: { kind: 'unclear' } });
  });

  it('has nothing to name when the owner gave the disc up themselves', () => {
    expect(toListedErrand(null, true)).toEqual({ errand: { kind: 'kept-by-club' }, superseded: null });
  });

  it('leaves an owner who gave the disc up before the club marked it alone too', () => {
    expect(toListedErrand(null, false)).toEqual({ errand: { kind: 'kept-by-club' }, superseded: null });
  });

  it("says an unreadable row is unreadable while the disc is still the owner's", () => {
    expect(toListedErrand(7, false)).toEqual({ errand: { kind: 'unclear' }, superseded: null });
  });
});

describe('supersededRequestLabel', () => {
  it('names what the owner asked for', () => {
    expect(supersededRequestLabel({ kind: 'to-owner', method: RetrievalMethod.ByMail })).toBe(
      'Huom! Omistaja on pyytänyt kiekkoa: Postitus',
    );
  });

  it('admits when the request cannot be read rather than passing it over', () => {
    expect(supersededRequestLabel({ kind: 'unclear' })).toBe(
      'Huom! Kiekolla on avoin noutopyyntö, jonka noutotapaa ei voi lukea – tarkista viestit.',
    );
  });
});
