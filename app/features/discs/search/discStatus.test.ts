import { describe, expect, it } from 'vitest';

import { DisposalMethod, ReturnMethod } from '~/discMethods';

import { discStatusLines, type DiscMarks } from './discStatus';

const unmarked: DiscMarks = {
  isReturnedToOwner: false,
  returnedToOwnerDate: null,
  returnMethod: null,
  canBeSoldOrDonated: false,
  canBeSoldOrDonatedDate: null,
  canBeSoldOrDonatedMethod: null,
  archivedAt: null,
};

describe('discStatusLines', () => {
  it('says "Listalla" for a disc with no marks, one the front page shows', () => {
    expect(discStatusLines(unmarked)).toEqual([{ label: 'Listalla', date: null }]);
  });

  it('names the return method when one is recorded', () => {
    expect(
      discStatusLines({
        ...unmarked,
        isReturnedToOwner: true,
        returnedToOwnerDate: '2026-10-02',
        returnMethod: ReturnMethod.ByMail,
      }),
    ).toEqual([{ label: 'Palautettu omistajalle (Postitettu)', date: '2026-10-02' }]);
  });

  it('says only "Palautettu omistajalle" when no method is recorded', () => {
    expect(discStatusLines({ ...unmarked, isReturnedToOwner: true })).toEqual([
      { label: 'Palautettu omistajalle', date: null },
    ]);
  });

  it('names the disposal by its method, or by the mark itself without one', () => {
    expect(
      discStatusLines({
        ...unmarked,
        canBeSoldOrDonated: true,
        canBeSoldOrDonatedDate: '2026-10-02',
        canBeSoldOrDonatedMethod: DisposalMethod.Donated,
      }),
    ).toEqual([{ label: 'Lahjoitetaan', date: '2026-10-02' }]);

    expect(discStatusLines({ ...unmarked, canBeSoldOrDonated: true })).toEqual([
      { label: 'Myytävissä tai lahjoitettavissa', date: null },
    ]);
  });

  it('lists every mark a disc carries, archiving included', () => {
    expect(
      discStatusLines({
        ...unmarked,
        isReturnedToOwner: true,
        returnedToOwnerDate: '2026-09-01',
        archivedAt: '2026-10-01T12:00:00+00:00',
      }),
    ).toEqual([
      { label: 'Palautettu omistajalle', date: '2026-09-01' },
      { label: 'Arkistoitu', date: '2026-10-01T12:00:00+00:00' },
    ]);
  });
});
