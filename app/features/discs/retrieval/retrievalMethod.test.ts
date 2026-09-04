import { describe, expect, it } from 'vitest';

import { RetrievalMethod, isRetrievalMethod, retrievalMethodLabel, retrievalMethodOptions } from './retrievalMethod';
import { HandoverMethod } from '~/features/discs/handoverMethod';

describe('retrievalMethod', () => {
  it('offers the two methods that need a trip to the storage, in form order', () => {
    expect(retrievalMethodOptions).toEqual([
      { value: 0, label: 'Postitus' },
      { value: 1, label: 'Nouto (minulta)' },
    ]);
  });

  it.each([
    [RetrievalMethod.ByMail, 'Postitus'],
    [RetrievalMethod.PickedUp, 'Nouto (minulta)'],
  ])('labels %i as %s', (value, label) => {
    expect(retrievalMethodLabel(value)).toBe(label);
  });

  it.each([null, undefined, 3, -1])('has no label for %s', (value) => {
    expect(retrievalMethodLabel(value)).toBeNull();
  });

  it('is the shared handover method, narrowed — not an enum of its own', () => {
    expect(RetrievalMethod.ByMail).toBe(HandoverMethod.ByMail);
    expect(RetrievalMethod.PickedUp).toBe(HandoverMethod.PickedUpFromHome);
  });

  it.each([0, 1])('accepts %i', (value) => {
    expect(isRetrievalMethod(value)).toBe(true);
  });

  // The one a disc list must not offer: nothing has to be fetched for an owner
  // who collects from the storage himself.
  it('rejects collecting from the storage, which is no errand', () => {
    expect(isRetrievalMethod(HandoverMethod.PickedUpFromStorage)).toBe(false);
  });

  it.each<[string, unknown]>([
    ['a string digit', '0'],
    ['an unknown method', 3],
    ['a negative number', -1],
    ['a fraction', 0.5],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_reason, value) => {
    expect(isRetrievalMethod(value)).toBe(false);
  });
});
