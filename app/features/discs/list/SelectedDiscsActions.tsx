import { useState, type JSX } from 'react';

import {
  batchActionLabels,
  batchActionOutcome,
  confirmBatchAction,
  type BatchAction,
} from '~/features/discs/batch/batchAction';
import { runBatchAction } from '~/features/discs/batch/runBatchAction';
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

/** One ticked disc, and whether there is anyone to text about it. */
export type SelectedDisc = { externalId: string; hasPhoneNumber: boolean };

type Props = {
  /** The selected discs, in the order the list shows them. */
  selected: SelectedDisc[];
  onClear: () => void;
  /** Called after discs have been deleted or marked, to reload the list. */
  onChanged?: () => void;
};

/** The three actions, in the order the bar offers them. */
const actions: BatchAction[] = ['return', 'disposal', 'delete'];

/**
 * What the bar has to say, and which of the two moments it belongs to.
 *
 * A report of what was done belongs to a finished action, and the selection is
 * empty behind it; ticking the next batch is what makes it stale, so it is only
 * rendered while nothing is selected. An error belongs to a selection that is
 * still there to try again, so it is rendered beside the buttons.
 */
type Notice = { kind: 'done' | 'error'; text: string };

/**
 * What can be done with the discs ticked in the list.
 *
 * Shown only once something is selected: an empty bar above the table would be
 * clutter for the far more common case of just reading the list. It stays for
 * one more render after an action, with the selection cleared, so its report of
 * what happened does not vanish with the ticks.
 *
 * The message link is written out here, as the row's own message icon writes
 * out /message/send/:externalId. How many discs one batch may carry is the send
 * page's rule and it says so itself; the only thing stopped from this side is a
 * link too long to survive the trip.
 */
export default function SelectedDiscsActions({ selected, onClear, onChanged }: Props): JSX.Element | null {
  const [busy, setBusy] = useState<BatchAction | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handle = async (action: BatchAction): Promise<void> => {
    const externalIds = selected.map((disc) => disc.externalId);

    if (!window.confirm(confirmBatchAction(action, externalIds.length))) {
      return;
    }

    setBusy(action);
    setNotice(null);

    const result = await runBatchAction(action, externalIds);

    setBusy(null);

    if (result.status === 'error') {
      setNotice({ kind: 'error', text: result.message });

      return;
    }

    setNotice({ kind: 'done', text: batchActionOutcome(action, result.affected, externalIds.length) });
    onClear();
    onChanged?.();
  };

  if (selected.length === 0) {
    return notice?.kind === 'done' ? (
      <p className="mb-4 text-sm" aria-live="polite">
        {notice.text}
      </p>
    ) : null;
  }

  // Texting needs a number to send to, and a disc can be ticked without one:
  // those are simply left out of the message batch rather than kept out of the
  // selection, which the other three actions have no use for a number in.
  const messageableIds = selected.filter((disc) => disc.hasPhoneNumber).map((disc) => disc.externalId);
  const href = `/message/send-batch?ids=${messageableIds.join(',')}`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <span aria-live="polite">
        {selected.length} {selected.length === 1 ? 'kiekko' : 'kiekkoa'} valittu
      </span>

      {messageableIds.length === 0 ? (
        <span className="text-sm">Valituilla kiekoilla ei ole puhelinnumeroa.</span>
      ) : href.length <= MAX_HREF_LENGTH ? (
        <Button variant="contained" to={href}>
          {`Lähetä sms ${messageableIds.length} henkilölle`}
        </Button>
      ) : (
        <span className="text-sm">Valinta on liian suuri kerralla lähetettäväksi. Valitse pienempi joukko.</span>
      )}

      {actions.map((action) => (
        <Button
          key={action}
          variant={action === 'delete' ? 'contained' : 'outlined'}
          color={action === 'delete' ? 'error' : 'primary'}
          disabled={busy !== null}
          onClick={() => handle(action)}
        >
          {busy === action ? 'Käsitellään...' : batchActionLabels[action]}
        </Button>
      ))}

      <Button variant="outlined" disabled={busy !== null} onClick={onClear}>
        Tyhjennä valinta
      </Button>

      {notice?.kind === 'error' && (
        <p className="basis-full text-sm" aria-live="polite">
          {notice.text}
        </p>
      )}
    </div>
  );
}
