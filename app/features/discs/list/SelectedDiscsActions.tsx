import type { JSX } from 'react';

import { buildSendBatchHref, MAX_BATCH_SIZE } from '~/lib/messageBatchUrl';
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
 */
export default function SelectedDiscsActions({ externalIds, onClear }: Props): JSX.Element | null {
  if (externalIds.length === 0) {
    return null;
  }

  const isTooMany = externalIds.length > MAX_BATCH_SIZE;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <span aria-live="polite">
        {externalIds.length} {externalIds.length === 1 ? 'kiekko' : 'kiekkoa'} valittu
      </span>

      {isTooMany ? (
        <span className="text-sm">Valitse enintään {MAX_BATCH_SIZE} kiekkoa kerrallaan.</span>
      ) : (
        <Button variant="contained" to={buildSendBatchHref(externalIds)}>
          Lähetä sms valituille henkilöille
        </Button>
      )}

      <Button variant="outlined" onClick={onClear}>
        Tyhjennä valinta
      </Button>
    </div>
  );
}
