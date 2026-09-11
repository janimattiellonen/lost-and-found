import { describe, expect, it } from 'vitest';

import { getDisposalMethodCounts, getReturnMethodCounts } from './statsUtils';
import { DisposalMethod, ReturnMethod } from '~/discMethods';
import type { DiscDTO } from '~/types';

function disc(fields: Partial<DiscDTO>): DiscDTO {
  return { internalDiscId: null, discName: 'Destroyer', discColour: '', clubId: 1, ...fields };
}

describe('getDisposalMethodCounts', () => {
  it('splits the released discs by method', () => {
    const counts = getDisposalMethodCounts([
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
    ]);

    expect(counts).toEqual([
      { label: 'Myydään', value: 1 },
      { label: 'Lahjoitetaan', value: 2 },
    ]);
  });

  it('counts a disc with no method under "Ei kirjattu"', () => {
    const counts = getDisposalMethodCounts([
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: null }),
      disc({ canBeSoldOrDonated: true }),
    ]);

    expect(counts).toEqual([
      { label: 'Myydään', value: 1 },
      { label: 'Lahjoitetaan', value: 0 },
      { label: 'Ei kirjattu', value: 2 },
    ]);
  });

  it('ignores discs the club has not released', () => {
    const counts = getDisposalMethodCounts([
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: false, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
      disc({}),
    ]);

    expect(counts).toEqual([
      { label: 'Myydään', value: 1 },
      { label: 'Lahjoitetaan', value: 0 },
    ]);
  });

  it('adds up to the headline count it sits under', () => {
    const data = [
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Sold }),
      disc({ canBeSoldOrDonated: true, canBeSoldOrDonatedMethod: DisposalMethod.Donated }),
      disc({ canBeSoldOrDonated: true }),
      disc({ canBeSoldOrDonated: false }),
    ];

    const total = getDisposalMethodCounts(data).reduce((sum, count) => sum + count.value, 0);

    expect(total).toBe(data.filter((item) => item.canBeSoldOrDonated).length);
  });
});

describe('getReturnMethodCounts', () => {
  it('splits the returned discs by method', () => {
    const counts = getReturnMethodCounts([
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.ByMail }),
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.PickedUp }),
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.PickedUp }),
    ]);

    expect(counts).toEqual([
      { label: 'Postitettu', value: 1 },
      { label: 'Noudettu', value: 2 },
    ]);
  });

  it('counts a returned disc with no method under "Ei kirjattu"', () => {
    const counts = getReturnMethodCounts([
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.ByMail }),
      disc({ isReturnedToOwner: true, returnMethod: null }),
    ]);

    expect(counts).toEqual([
      { label: 'Postitettu', value: 1 },
      { label: 'Noudettu', value: 0 },
      { label: 'Ei kirjattu', value: 1 },
    ]);
  });

  it('ignores discs that never went back', () => {
    const counts = getReturnMethodCounts([
      disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.ByMail }),
      disc({ isReturnedToOwner: false, returnMethod: ReturnMethod.PickedUp }),
    ]);

    expect(counts).toEqual([
      { label: 'Postitettu', value: 1 },
      { label: 'Noudettu', value: 0 },
    ]);
  });

  it('leaves out "Ei kirjattu" when every disc has a method', () => {
    const counts = getReturnMethodCounts([disc({ isReturnedToOwner: true, returnMethod: ReturnMethod.PickedUp })]);

    expect(counts.map((count) => count.label)).toEqual(['Postitettu', 'Noudettu']);
  });

  it('shows both methods at zero when nothing has been returned', () => {
    expect(getReturnMethodCounts([disc({ isReturnedToOwner: false })])).toEqual([
      { label: 'Postitettu', value: 0 },
      { label: 'Noudettu', value: 0 },
    ]);
  });
});
