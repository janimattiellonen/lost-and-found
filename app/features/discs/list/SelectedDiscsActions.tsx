import type { JSX } from 'react';

import Button from '~/ui/Button';

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
 * page's rule, and it says so itself rather than being second-guessed from
 * this side.
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

      <Button variant="contained" to={href}>
        Lähetä sms valituille henkilöille
      </Button>

      <Button variant="outlined" onClick={onClear}>
        Tyhjennä valinta
      </Button>
    </div>
  );
}
