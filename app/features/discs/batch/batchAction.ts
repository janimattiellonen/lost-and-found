/**
 * The actions that can be applied to a whole selection of discs at once.
 *
 * Messaging is not one of them: it is a walk through the selection one owner at
 * a time (see the send-batch page), not a single write.
 */
export const batchActions = ['delete', 'return', 'disposal'] as const;

export type BatchAction = (typeof batchActions)[number];

export function isBatchAction(value: unknown): value is BatchAction {
  return typeof value === 'string' && (batchActions as readonly string[]).includes(value);
}

/**
 * How many discs one batch may carry.
 *
 * Generous enough that a whole club's list fits, so the cap is a bound on the
 * query rather than something the admin runs into.
 */
export const MAX_BATCH_ACTION_SIZE = 500;

/**
 * What each action is called where it is offered.
 *
 * They say nothing about a selection: the dropdown these sit in is beside the
 * count of ticked discs, which is what they act on.
 */
export const batchActionLabels: Record<BatchAction, string> = {
  delete: 'Poista',
  return: 'Merkitse palautetuiksi',
  disposal: 'Merkitse myytäviksi tai lahjoitettaviksi',
};

/** A count of discs, with the noun in the case Finnish puts it in. */
function discCount(count: number): string {
  return count === 1 ? '1 kiekko' : `${count} kiekkoa`;
}

/**
 * What the browser asks before the action runs: what is about to happen, and to
 * how many discs.
 *
 * Which discs is deliberately left out — the selection is on screen right
 * behind the dialog, and naming a dozen of them here would only be read as
 * noise and clicked past.
 */
export function confirmBatchAction(action: BatchAction, count: number): string {
  switch (action) {
    case 'delete': {
      return `Poistetaanko ${discCount(count)}? Poistoa ei voi peruuttaa.`;
    }
    case 'return': {
      return `Merkitäänkö ${discCount(count)} palautetuksi?`;
    }
    case 'disposal': {
      return `Merkitäänkö ${discCount(count)} myytäväksi tai lahjoitettavaksi?`;
    }
  }
}

/** What each action calls what it did, for the report afterwards. */
const pastTense: Record<BatchAction, string> = {
  delete: 'Poistettiin',
  return: 'Merkittiin palautetuksi',
  disposal: 'Merkittiin myytäväksi tai lahjoitettavaksi',
};

/**
 * What the bar reports once the action has gone through.
 *
 * A shortfall is reported rather than passed over: an id that no longer
 * resolves is not an error, but the admin should not be told a dozen discs were
 * handled when ten were.
 */
export function batchActionOutcome(action: BatchAction, affected: number, requested: number): string {
  const done = `${pastTense[action]} ${discCount(affected)}.`;

  if (affected < requested) {
    return `${done} ${discCount(requested - affected)} jäi käsittelemättä – kiekkoja ei löytynyt tai niitä ei voitu muuttaa.`;
  }

  return done;
}
