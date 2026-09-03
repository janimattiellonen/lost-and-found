import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId, isIsoDate } from '~/lib/api/validate';
import { deleteDiscs, markDiscsAsReturned, markDiscsForDisposal } from '~/models/discs.server';

import { isBatchAction, MAX_BATCH_ACTION_SIZE, type BatchAction } from './batchAction';

/** The ids a batch may act on, or the reason this selection is not one. */
type Selection = { externalIds: string[] } | { error: string };

/**
 * Reads the selection out of the request body.
 *
 * Deduplicated so the count reported back stands for discs, not for the number
 * of times an id was sent.
 */
function readSelection(value: unknown): Selection {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isExternalId)) {
    return { error: 'Virheellinen kiekkojen tunnistelista.' };
  }

  const externalIds = [...new Set(value)];

  if (externalIds.length > MAX_BATCH_ACTION_SIZE) {
    return { error: `Yhdellä kertaa voi käsitellä enintään ${MAX_BATCH_ACTION_SIZE} kiekkoa.` };
  }

  return { externalIds };
}

/**
 * The two actions that record a date: returned to its owner, and free to be
 * sold or donated.
 *
 * Both are dated but carry no method: over a selection there is no one method
 * that would be true of every disc in it, so the method is left unanswered —
 * which is what the column holds for any disc marked without one.
 */
function applyMark(
  action: Exclude<BatchAction, 'delete'>,
  externalIds: string[],
  date: string,
  request: Request,
): Promise<number> {
  if (action === 'return') {
    return markDiscsAsReturned(externalIds, { returnedToOwnerDate: date, returnMethod: null }, request);
  }

  return markDiscsForDisposal(externalIds, { canBeSoldOrDonatedDate: date, canBeSoldOrDonatedMethod: null }, request);
}

/** Answers with how many discs the action reached, or with why it could not. */
async function report(apply: () => Promise<number>): Promise<Response> {
  try {
    return Response.json({ affected: await apply() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Toimenpide epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}

/** Authorises, validates and applies an action posted to /discs/batch. */
export async function handleBatchRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const { action, externalIds, date } = (gate.body ?? {}) as Record<string, unknown>;

  if (!isBatchAction(action)) {
    return Response.json({ error: 'Tuntematon toimenpide.' }, { status: 422 });
  }

  const selection = readSelection(externalIds);

  if ('error' in selection) {
    return Response.json({ error: selection.error }, { status: 422 });
  }

  // A delete records nothing, so it is the one action that needs no date.
  if (action === 'delete') {
    return report(() => deleteDiscs(selection.externalIds, request));
  }

  if (!isIsoDate(date)) {
    return Response.json({ error: 'Virheellinen päivämäärä.' }, { status: 422 });
  }

  return report(() => applyMark(action, selection.externalIds, date, request));
}
