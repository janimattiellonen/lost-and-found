import { describe, expect, it } from 'vitest';

import { handoverMethodsFor } from './handoverMethodsFor';
import { HandoverMethod } from '~/features/discs/handoverMethod';

describe('handoverMethodsFor', () => {
  it('offers collecting from the storage only while the disc is in it', () => {
    expect(handoverMethodsFor(true)).toEqual([
      HandoverMethod.ByMail,
      HandoverMethod.PickedUpFromHome,
      HandoverMethod.PickedUpFromStorage,
    ]);
  });

  // Every Puskasoturit disc, and every Talin Tallaajat disc already fetched
  // home: there is nothing at a storage to collect.
  it('offers post and collection from the admin for a disc at the house', () => {
    expect(handoverMethodsFor(false)).toEqual([HandoverMethod.ByMail, HandoverMethod.PickedUpFromHome]);
  });
});
