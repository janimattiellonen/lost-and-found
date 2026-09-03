import { useState } from 'react';

import { batchActionOutcome, confirmBatchAction, type BatchAction } from './batchAction';
import { runBatchAction } from './runBatchAction';

/**
 * What the caller has to say about the last thing it tried, and which of the
 * two moments it belongs to.
 *
 * A report of what was done belongs to a finished action, with the selection
 * emptied behind it; an error belongs to a selection that is still there to try
 * again. Callers render them in different places for that reason.
 */
export type BatchNotice = { kind: 'done' | 'error'; text: string };

type Options = {
  /** Called once a write has gone through, to clear the ticks and reload. */
  onDone: () => void;
};

/**
 * Running one batch action: the confirmation, the request, and what to say
 * afterwards.
 *
 * Kept out of the selection bar, which otherwise owned four unrelated things
 * at once — this state machine, the navigation to the message walk, the
 * dropdown, and the cap messaging.
 */
export function useBatchAction({ onDone }: Options) {
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<BatchNotice | null>(null);

  /**
   * Confirms, runs, and reports. Resolves to true only when the write went
   * through, so the caller can reset itself on that and leave it alone
   * otherwise.
   */
  const run = async (action: BatchAction, externalIds: string[]): Promise<boolean> => {
    if (!window.confirm(confirmBatchAction(action, externalIds.length))) {
      return false;
    }

    setIsBusy(true);
    setNotice(null);

    const result = await runBatchAction(action, externalIds);

    setIsBusy(false);

    if (result.status === 'error') {
      setNotice({ kind: 'error', text: result.message });

      return false;
    }

    setNotice({ kind: 'done', text: batchActionOutcome(action, result.affected, externalIds.length) });
    onDone();

    return true;
  };

  /** For something the caller itself refused, before any request was made. */
  const fail = (text: string): void => setNotice({ kind: 'error', text });

  return { isBusy, notice, run, fail };
}
