import { DisposalMethod, type DisposalMethodValue } from '~/features/discs/disposal/disposalMethod';
import { ReturnMethod, type ReturnMethodValue } from '~/features/discs/return/returnMethod';

/**
 * The actions that can be applied to a whole selection of discs at once.
 *
 * Both marks name their method rather than taking one beside them. The method
 * is the whole point of either mark — a released disc that says neither sale
 * nor donation, or a returned one that says neither by post nor in person, is a
 * row nobody can act on — and by the time the admin picks the action the choice
 * is already made, so a second step asking for it would be a step to click
 * past. The single-disc forms still ask, because there either can be left
 * unanswered.
 *
 * Messaging is not one of these: it is a walk through the selection one owner
 * at a time (see the send-batch page), not a single write.
 */
export const batchActions = ['delete', 'returnByMail', 'returnPickedUp', 'sell', 'donate'] as const;

export type BatchAction = (typeof batchActions)[number];

export function isBatchAction(value: unknown): value is BatchAction {
  return typeof value === 'string' && (batchActions as readonly string[]).includes(value);
}

/** The marks: everything but a delete records a date and a method. */
export type MarkAction = Exclude<BatchAction, 'delete'>;

/**
 * How many discs one batch may carry.
 *
 * Generous enough that a whole club's list fits, so the cap is a bound on the
 * query rather than something the admin runs into.
 */
export const MAX_BATCH_ACTION_SIZE = 500;

/**
 * Which fate a release records, and how a return got there, read off the action
 * itself.
 *
 * Both are a smallint in the database and nothing in the UI shows the number,
 * so an inverted mapping would write "donate" on every disc the club means to
 * sell, or "posted" on every one handed over in person, without anything
 * looking wrong. Pinned by tests against the labels.
 */
export function disposalMethodFor(action: 'sell' | 'donate'): DisposalMethodValue {
  return action === 'sell' ? DisposalMethod.Sold : DisposalMethod.Donated;
}

export function returnMethodFor(action: 'returnByMail' | 'returnPickedUp'): ReturnMethodValue {
  return action === 'returnByMail' ? ReturnMethod.ByMail : ReturnMethod.PickedUp;
}

/** A count of discs, with the noun in the case Finnish puts it in. */
function discCount(count: number): string {
  return count === 1 ? '1 kiekko' : `${count} kiekkoa`;
}

/**
 * What each action is called where it is offered, what it asks before it runs,
 * and what it calls what it did afterwards.
 *
 * The three kept together per action rather than in a table each: they are the
 * same sentence in three tenses, and apart they drifted.
 *
 * The labels say nothing about a selection — the dropdown they sit in is beside
 * the count of ticked discs, which is what says what they act on. What the
 * confirmation leaves out is which discs: the selection is on screen right
 * behind the dialog, and naming a dozen of them would be read as noise and
 * clicked past.
 */
const copy: Record<BatchAction, { label: string; asks: (discs: string) => string; did: string }> = {
  returnByMail: {
    label: 'Merkitse palautetuiksi (postitettu)',
    asks: (discs) => `Merkitäänkö ${discs} palautetuksi (postitettu)?`,
    did: 'Merkittiin palautetuksi (postitettu)',
  },
  returnPickedUp: {
    label: 'Merkitse palautetuiksi (noudettu)',
    asks: (discs) => `Merkitäänkö ${discs} palautetuksi (noudettu)?`,
    did: 'Merkittiin palautetuksi (noudettu)',
  },
  sell: {
    label: 'Merkitse myytäviksi',
    asks: (discs) => `Merkitäänkö ${discs} myytäväksi?`,
    did: 'Merkittiin myytäväksi',
  },
  donate: {
    label: 'Merkitse lahjoitettaviksi',
    asks: (discs) => `Merkitäänkö ${discs} lahjoitettavaksi?`,
    did: 'Merkittiin lahjoitettavaksi',
  },
  delete: {
    label: 'Poista',
    asks: (discs) => `Poistetaanko ${discs}? Poistoa ei voi peruuttaa.`,
    did: 'Poistettiin',
  },
};

/** The order the dropdown offers the writes in. */
export const batchActionOrder: BatchAction[] = ['returnByMail', 'returnPickedUp', 'sell', 'donate', 'delete'];

export function batchActionLabel(action: BatchAction): string {
  return copy[action].label;
}

/** What the browser asks before the action runs. */
export function confirmBatchAction(action: BatchAction, count: number): string {
  return copy[action].asks(discCount(count));
}

/**
 * What the bar reports once the action has gone through.
 *
 * A shortfall is reported rather than passed over: an id that no longer
 * resolves is not an error, but the admin should not be told a dozen discs were
 * handled when ten were.
 */
export function batchActionOutcome(action: BatchAction, affected: number, requested: number): string {
  const done = `${copy[action].did} ${discCount(affected)}.`;

  if (affected < requested) {
    return `${done} ${discCount(requested - affected)} jäi käsittelemättä – kiekkoja ei löytynyt tai niitä ei voitu muuttaa.`;
  }

  return done;
}
