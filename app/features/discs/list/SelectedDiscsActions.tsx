import { useState, type JSX } from 'react';

import { useNavigate } from 'react-router';

import {
  batchActionLabel,
  batchActionOrder,
  batchActionOutcome,
  confirmBatchAction,
  MAX_SELECTED_DISCS,
  type BatchAction,
} from '~/features/discs/batch/batchAction';
import { runBatchAction } from '~/features/discs/batch/runBatchAction';
import Button from '~/ui/Button';
import Select, { MenuItem } from '~/ui/Select';

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
 * Messaging sits alongside the three writes here because it is a fourth thing
 * to do with a selection, but it is not one of them: it navigates to a walk
 * through the owners one at a time, and the server knows nothing of it.
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
 * One dropdown and a button rather than a button per action: four of them side
 * by side filled the width above the table and gave a delete the same weight as
 * the one action that is used daily.
 */
export default function SelectedDiscsActions({ selected, onClear, onChanged }: Props): JSX.Element | null {
  const navigate = useNavigate();

  const [action, setAction] = useState<SelectedAction | ''>('');
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Texting needs a number to send to, and a disc can be ticked without one:
  // those are simply left out of the message batch rather than kept out of the
  // selection, which the other three actions have no use for a number in.
  const messageableIds = selected.filter((disc) => disc.hasPhoneNumber).map((disc) => disc.externalId);

  const startMessaging = (): void => {
    const href = `/message/send-batch?ids=${messageableIds.join(',')}`;

    if (href.length > MAX_HREF_LENGTH) {
      setNotice({ kind: 'error', text: TOO_LARGE_TO_SEND });

      return;
    }

    navigate(href);
  };

  const runWrite = async (write: BatchAction): Promise<void> => {
    const externalIds = selected.map((disc) => disc.externalId);

    if (!window.confirm(confirmBatchAction(write, externalIds.length))) {
      return;
    }

    setIsBusy(true);
    setNotice(null);

    const result = await runBatchAction(write, externalIds);

    setIsBusy(false);

    if (result.status === 'error') {
      setNotice({ kind: 'error', text: result.message });

      return;
    }

    setNotice({ kind: 'done', text: batchActionOutcome(write, result.affected, externalIds.length) });
    setAction('');
    onClear();
    onChanged?.();
  };

  const handleRun = (): void => {
    if (action === '') {
      return;
    }

    if (action === 'message') {
      startMessaging();

      return;
    }

    void runWrite(action);
  };

  if (selected.length === 0) {
    return notice?.kind === 'done' ? (
      <p className="mb-4 text-sm" aria-live="polite">
        {notice.text}
      </p>
    ) : null;
  }

  // Left out rather than offered and refused when not one selected disc has a
  // number: there would be nobody to send to.
  const options = messageableIds.length > 0 ? actionOrder : actionOrder.filter((option) => option !== 'message');

  const labelFor = (option: SelectedAction): string =>
    option === 'message' ? `Lähetä sms ${messageableIds.length} henkilölle` : batchActionLabel(option);

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

      {messageableIds.length === 0 && <span className="text-sm">Valituilla kiekoilla ei ole puhelinnumeroa.</span>}

      {/* Said here as well as on the boxes it disables: the admin who has just
          hit the cap is looking at the count, not hovering a checkbox. */}
      {selected.length >= MAX_SELECTED_DISCS && (
        <span className="text-sm">Enimmäismäärä {MAX_SELECTED_DISCS} kiekkoa valittu.</span>
      )}

      {notice?.kind === 'error' && (
        <p className="basis-full text-sm" aria-live="polite">
          {notice.text}
        </p>
      )}
    </div>
  );
}

/**
 * What the bar has to say, and which of the two moments it belongs to.
 *
 * A report of what was done belongs to a finished action, and the selection is
 * empty behind it; ticking the next batch is what makes it stale, so it is only
 * rendered while nothing is selected. An error belongs to a selection that is
 * still there to try again, so it is rendered beside the buttons.
 */
type Notice = { kind: 'done' | 'error'; text: string };
