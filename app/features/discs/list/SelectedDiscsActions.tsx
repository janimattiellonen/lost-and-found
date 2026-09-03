import { useState, type JSX } from 'react';

import { useNavigate } from 'react-router';

import {
  batchActionLabel,
  batchActionOrder,
  MAX_DISCS_PER_WRITE,
  type BatchAction,
} from '~/features/discs/batch/batchAction';
import { useBatchAction } from '~/features/discs/batch/useBatchAction';
import Button from '~/ui/Button';
import Select, { MenuItem } from '~/ui/Select';

/**
 * How long the handover link may get.
 *
 * The selection rides in the query string, and a request line past about eight
 * kilobytes is refused by the server with a 431 before any of this app's code
 * runs. A selection is capped well below that now, so this is a backstop rather
 * than something reachable.
 */
const MAX_HREF_LENGTH = 6000;

const TOO_LARGE_TO_SEND = 'Valinta on liian suuri kerralla lähetettäväksi. Valitse pienempi joukko.';

/** One ticked disc, and whether there is anyone to text about it. */
export type SelectedDisc = { externalId: string; hasPhoneNumber: boolean };

type Props = {
  /** The selected discs, in the order the list shows them. */
  selected: SelectedDisc[];
  onClear: () => void;
  /** Called after discs have been deleted or marked, to reload the list. */
  onChanged?: () => void;
};

/**
 * What the bar can be asked to do.
 *
 * Messaging sits alongside the writes here because it is another thing to do
 * with a selection, but it is not one of them: it navigates to a walk through
 * the owners one at a time, and the server knows nothing of it.
 */
type SelectedAction = BatchAction | 'message';

/** Messaging first, as the most used; the writes in the order they are listed. */
const actionOrder: SelectedAction[] = ['message', ...batchActionOrder];

/**
 * What can be done with the discs ticked in the list.
 *
 * Shown only once something is selected: an empty bar above the table would be
 * clutter for the far more common case of just reading the list. It stays for
 * one more render after an action, with the selection cleared, so its report of
 * what happened does not vanish with the ticks.
 *
 * One dropdown and a button rather than a button per action: five of them side
 * by side filled the width above the table and gave a delete the same weight as
 * the one action used daily.
 */
export default function SelectedDiscsActions({ selected, onClear, onChanged }: Props): JSX.Element | null {
  const navigate = useNavigate();

  const [action, setAction] = useState<SelectedAction | ''>('');

  const { isBusy, notice, run, fail } = useBatchAction({
    onDone: () => {
      setAction('');
      onClear();
      onChanged?.();
    },
  });

  // Texting needs a number to send to, and a disc can be ticked without one:
  // those are left out of the message batch rather than kept out of the
  // selection, which the writes have no use for a number in.
  const messageableIds = selected.filter((disc) => disc.hasPhoneNumber).map((disc) => disc.externalId);
  const withoutNumber = selected.length - messageableIds.length;

  // Two reasons an action is left out rather than offered and then refused:
  // there is nobody to text, or the selection is larger than a write may
  // cover. Either way the note beside the dropdown says which.
  const tooManyToWrite = selected.length > MAX_DISCS_PER_WRITE;

  const options = actionOrder.filter((option) => (option === 'message' ? messageableIds.length > 0 : !tooManyToWrite));

  const labelFor = (option: SelectedAction): string =>
    option === 'message' ? `Lähetä sms ${messageableIds.length} henkilölle` : batchActionLabel(option);

  const startMessaging = (): void => {
    const href = `/message/send-batch?ids=${messageableIds.join(',')}`;

    if (href.length > MAX_HREF_LENGTH) {
      fail(TOO_LARGE_TO_SEND);

      return;
    }

    navigate(href);
  };

  const handleRun = (): void => {
    // The chosen action can have left the dropdown between choosing it and
    // pressing the button — a tick past the write cap does that.
    if (action === '' || !options.includes(action)) {
      return;
    }

    if (action === 'message') {
      startMessaging();

      return;
    }

    void run(
      action,
      selected.map((disc) => disc.externalId),
    );
  };

  if (selected.length === 0) {
    return notice?.kind === 'done' ? (
      <p className="mb-4 text-sm" aria-live="polite">
        {notice.text}
      </p>
    ) : null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <span aria-live="polite">
        {selected.length} {selected.length === 1 ? 'kiekko' : 'kiekkoa'} valittu
      </span>

      <Select
        aria-label="Toimenpide valituille kiekoille"
        value={action}
        disabled={isBusy}
        onChange={(event) => setAction(event.currentTarget.value as SelectedAction | '')}
      >
        <MenuItem value="">Valitse toimenpide...</MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {labelFor(option)}
          </MenuItem>
        ))}
      </Select>

      <Button variant="contained" disabled={action === '' || isBusy} onClick={handleRun}>
        {isBusy ? 'Käsitellään...' : 'Suorita'}
      </Button>

      <Button variant="outlined" disabled={isBusy} onClick={onClear}>
        Tyhjennä valinta
      </Button>

      {/* Said outright rather than left to be inferred from an sms count that
          is lower than the number of ticks. The writes still cover every
          selected disc, so this only qualifies the message option. */}
      {withoutNumber > 0 && (
        <span className="text-sm">
          {messageableIds.length === 0
            ? 'Valituilla kiekoilla ei ole puhelinnumeroa.'
            : `${withoutNumber} valitulla kiekolla ei ole puhelinnumeroa – ne jäävät viestin ulkopuolelle.`}
        </span>
      )}

      {/* The selection itself is not limited — only what may be written to at
          once, so this says what is missing from the dropdown and why. */}
      {tooManyToWrite && (
        <span className="text-sm">
          Merkintä ja poisto koskevat enintään {MAX_DISCS_PER_WRITE} kiekkoa kerralla – valitse pienempi joukko.
        </span>
      )}

      {notice?.kind === 'error' && (
        <p className="basis-full text-sm" aria-live="polite">
          {notice.text}
        </p>
      )}
    </div>
  );
}
