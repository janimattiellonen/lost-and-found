import { describe, expect, it } from 'vitest';

import { getDisposalMethodCounts, getReturnMethodCounts, getTopLostDiscsByDiscName } from './statsUtils';
import { DisposalMethod, ReturnMethod } from '~/discMethods';
import type { DiscDTO } from '~/types';

function disc(fields: Partial<DiscDTO>): DiscDTO {
  return { internalDiscId: null, discName: 'Destroyer', discColour: '', clubId: 1, ...fields };
}

function discs(...names: string[]): DiscDTO[] {
  return names.map((discName) => ({ internalDiscId: null, discName, discColour: '', clubId: 1 }));
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

describe('getTopLostDiscsByDiscName', () => {
  it('counts the exact stored string when grouping is off', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer, Star', 'Destroyer, Star', 'Destroyer, Halo'));

    expect(stats).toEqual([
      { label: 'Destroyer, Star', value: 2 },
      { label: 'Destroyer, Halo', value: 1 },
    ]);
  });

  it('drops the plastic after the comma when grouping is on', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer, Star', 'Destroyer, Halo', 'Destroyer'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([{ label: 'Destroyer', value: 3 }]);
  });

  it('ignores case when grouping', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer', 'destroyer', 'DEstroyer', 'destroyer, Star'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([{ label: 'destroyer', value: 4 }]);
  });

  it('labels a group with its commonest spelling', () => {
    const stats = getTopLostDiscsByDiscName(discs('DEstroyer', 'Destroyer', 'Destroyer, Star'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([{ label: 'Destroyer', value: 3 }]);
  });

  it('accepts a full stop where the comma was meant', () => {
    const stats = getTopLostDiscsByDiscName(discs('Essence, NEO', 'Essence. NEO'), { groupByDiscName: true });

    expect(stats).toEqual([{ label: 'Essence', value: 2 }]);
  });

  it('keeps a two-word mould whole', () => {
    const stats = getTopLostDiscsByDiscName(discs('Night Trooper', 'Night  Trooper', 'Sea Serpent'), {
      groupByDiscName: true,
    });

    expect(stats).toEqual([
      { label: 'Night Trooper', value: 2 },
      { label: 'Sea Serpent', value: 1 },
    ]);
  });

  it('leaves a plastic written without a comma as its own model', () => {
    const stats = getTopLostDiscsByDiscName(discs('Destroyer', 'Destroyer Star'), { groupByDiscName: true });

    expect(stats).toEqual([
      { label: 'Destroyer', value: 1 },
      { label: 'Destroyer Star', value: 1 },
    ]);
  });

  it('keeps the original text when there is nothing before the separator', () => {
    const stats = getTopLostDiscsByDiscName(discs(', Star'), { groupByDiscName: true });

    expect(stats).toEqual([{ label: ', Star', value: 1 }]);
  });

  it('takes the most-lost models up to the limit', () => {
    const stats = getTopLostDiscsByDiscName(discs('Wraith', 'Destroyer', 'Destroyer', 'Buzzz'), { limit: 2 });

    expect(stats).toEqual([
      { label: 'Destroyer', value: 2 },
      { label: 'Wraith', value: 1 },
    ]);
  });
});
