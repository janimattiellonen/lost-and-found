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

/**
 * What an action writes beyond the date: which pair of columns, and the method
 * that goes in them. Null for a delete, which records nothing.
 *
 * The method is a smallint in the database and nothing in the UI shows the
 * number, so a mapping that had sale and donation the wrong way round — or
 * posted and collected — would be invisible. It is declared once, in the table
 * below beside the action's own wording, and pinned by tests against the
 * labels.
 */
export type BatchMark =
  | { columns: 'return'; method: ReturnMethodValue }
  | { columns: 'disposal'; method: DisposalMethodValue };

export function markFor(action: BatchAction): BatchMark | null {
  return copy[action].mark;
}

/**
 * The most discs that may be ticked at once.
 *
 * Small on purpose. These actions are irreversible from the UI — a delete
 * especially — and the number stands between a mis-click and real damage: it is
 * how much a wrong action can cost. Twenty is more than a normal batch and
 * still a set the admin can read down and check before confirming.
 *
 * Enforced twice. The list stops the twenty-first tick, so the limit is
 * something the admin meets while choosing rather than a refusal after
 * confirming; the route refuses a longer body regardless, since the list is not
 * the only thing that can post one.
 */
export const MAX_SELECTED_DISCS = 20;

/** A count of discs, with the noun in the case Finnish puts it in. */
function discCount(count: number): string {
  return count === 1 ? '1 kiekko' : `${count} kiekkoa`;
}

/**
 * Everything that varies per action: what it is called where it is offered,
 * what it asks before it runs, what it calls what it did afterwards, and what
 * it writes.
 *
 * One row per action rather than a table per field. The three wordings are the
 * same sentence in three tenses and had already drifted apart when they were
 * separate; the mark belongs with them because an action's name and what it
 * writes are the same decision, and a reader checking that "myytäviksi" really
 * records a sale should not have to hold two files open.
 *
 * The labels say nothing about a selection — the dropdown they sit in is beside
 * the count of ticked discs, which is what says what they act on. What the
 * confirmation leaves out is which discs: the selection is on screen right
 * behind the dialog, and naming a dozen of them would be read as noise and
 * clicked past.
 */
const copy: Record<
  BatchAction,
  { label: string; asks: (discs: string) => string; did: string; mark: BatchMark | null }
> = {
  returnByMail: {
    label: 'Merkitse palautetuiksi (postitettu)',
    asks: (discs) => `Merkitäänkö ${discs} palautetuksi (postitettu)?`,
    did: 'Merkittiin palautetuksi (postitettu)',
    mark: { columns: 'return', method: ReturnMethod.ByMail },
  },
  returnPickedUp: {
    label: 'Merkitse palautetuiksi (noudettu)',
    asks: (discs) => `Merkitäänkö ${discs} palautetuksi (noudettu)?`,
    did: 'Merkittiin palautetuksi (noudettu)',
    mark: { columns: 'return', method: ReturnMethod.PickedUp },
  },
  sell: {
    label: 'Merkitse myytäviksi',
    asks: (discs) => `Merkitäänkö ${discs} myytäväksi?`,
    did: 'Merkittiin myytäväksi',
    mark: { columns: 'disposal', method: DisposalMethod.Sold },
  },
  donate: {
    label: 'Merkitse lahjoitettaviksi',
    asks: (discs) => `Merkitäänkö ${discs} lahjoitettavaksi?`,
    did: 'Merkittiin lahjoitettavaksi',
    mark: { columns: 'disposal', method: DisposalMethod.Donated },
  },
  delete: {
    label: 'Poista',
    asks: (discs) => `Poistetaanko ${discs}? Poistoa ei voi peruuttaa.`,
    did: 'Poistettiin',
    mark: null,
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
