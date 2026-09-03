import type { JSX } from 'react';

import Button from '~/ui/Button';

/**
 * How long the handover link may get.
 *
 * The selection rides in the query string, and a request line past about eight
 * kilobytes is refused by the server with a 431 before any of this app's code
 * runs — a selection of every disc in the list reaches fourteen. Well clear of
 * that, and still far more than the send page will accept, so a batch it would
 * take is never blocked here.
 */
const MAX_HREF_LENGTH = 6000;

type Props = {
  /** The selected discs' external ids, in the order the list shows them. */
  externalIds: string[];
  onClear: () => void;
};

/**
 * What can be done with the discs ticked in the list.
 *
 * Shown only once something is selected: an empty bar above the table would be
 * clutter for the far more common case of just reading the list.
 *
 * The link is written out here, as the row's own message icon writes out
 * /message/send/:externalId. How many discs one batch may carry is the send
 * page's rule and it says so itself; the only thing stopped from this side is a
 * link too long to survive the trip.
 */
export default function SelectedDiscsActions({ externalIds, onClear }: Props): JSX.Element | null {
  if (externalIds.length === 0) {
    return null;
  }

  const href = `/message/send-batch?ids=${externalIds.join(',')}`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <span aria-live="polite">
        {externalIds.length} {externalIds.length === 1 ? 'kiekko' : 'kiekkoa'} valittu
      </span>

      {href.length <= MAX_HREF_LENGTH ? (
        <Button variant="contained" to={href}>
          Lähetä sms valituille henkilöille
        </Button>
      ) : (
        <span className="text-sm">Valinta on liian suuri kerralla lähetettäväksi. Valitse pienempi joukko.</span>
      )}

      <Button variant="outlined" onClick={onClear}>
        Tyhjennä valinta
      </Button>
    </div>
  );
}
