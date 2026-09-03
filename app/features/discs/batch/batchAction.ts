import { DisposalMethod, type DisposalMethodValue } from '~/features/discs/disposal/disposalMethod';

/**
 * The actions that can be applied to a whole selection of discs at once.
 *
 * Releasing a disc is two of them rather than one with a method beside it.
 * Sale and donation are the whole point of that mark — a disc released without
 * saying which is a row nobody can act on — and asking in a second step for
 * something the admin has already decided is a step to click past. The single
 * disc form still asks, because there the method can be left unanswered.
 *
 * Messaging is not one of them: it is a walk through the selection one owner at
 * a time (see the send-batch page), not a single write.
 */
export const batchActions = ['delete', 'return', 'sell', 'donate'] as const;

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
  sell: 'Merkitse myytäviksi',
  donate: 'Merkitse lahjoitettaviksi',
};

/**
 * Which fate a release records, read off the action itself.
 *
 * The two are a smallint in the database and nothing in the UI shows the
 * number, so an inverted mapping here would write "donate" on every disc the
 * club means to sell without anything looking wrong. Pinned by a test against
 * the label.
 */
export function disposalMethodFor(action: 'sell' | 'donate'): DisposalMethodValue {
  return action === 'sell' ? DisposalMethod.Sold : DisposalMethod.Donated;
}

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
    case 'sell': {
      return `Merkitäänkö ${discCount(count)} myytäväksi?`;
    }
    case 'donate': {
      return `Merkitäänkö ${discCount(count)} lahjoitettavaksi?`;
    }
  }
}

/** What each action calls what it did, for the report afterwards. */
const pastTense: Record<BatchAction, string> = {
  delete: 'Poistettiin',
  return: 'Merkittiin palautetuksi',
  sell: 'Merkittiin myytäväksi',
  donate: 'Merkittiin lahjoitettavaksi',
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
