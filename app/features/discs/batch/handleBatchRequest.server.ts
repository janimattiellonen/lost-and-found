import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId, isIsoDate } from '~/lib/api/validate';
import { deleteDiscs, markDiscsAsReturned, markDiscsForDisposal } from '~/models/discs.server';

import { isBatchAction, markFor, MAX_DISCS_PER_WRITE, type BatchMark } from './batchAction';

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

  if (externalIds.length > MAX_DISCS_PER_WRITE) {
    return { error: `Yhdellä kertaa voi käsitellä enintään ${MAX_DISCS_PER_WRITE} kiekkoa.` };
  }

  return { externalIds };
}

type MarkInput = {
  mark: BatchMark;
  externalIds: string[];
  /** ISO date, y-MM-dd. */
  date: string;
};

/**
 * Applies a mark to the selection: which columns and which method both come
 * from the action's own row in the batch action table.
 */
function applyMark(request: Request, { mark, externalIds, date }: MarkInput): Promise<number> {
  if (mark.columns === 'return') {
    return markDiscsAsReturned(request, {
      externalIds,
      details: { returnedToOwnerDate: date, returnMethod: mark.method },
    });
  }

  return markDiscsForDisposal(request, {
    externalIds,
    details: { canBeSoldOrDonatedDate: date, canBeSoldOrDonatedMethod: mark.method },
  });
}

/** Answers with how many discs the action reached, or with why it could not. */
async function respondWithCount(apply: () => Promise<number>): Promise<Response> {
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

  const mark = markFor(action);

  // No mark to write is a delete, and a delete records nothing — so it is the
  // one action that needs no date.
  if (mark === null) {
    return respondWithCount(() => deleteDiscs(request, selection.externalIds));
  }

  if (!isIsoDate(date)) {
    return Response.json({ error: 'Virheellinen päivämäärä.' }, { status: 422 });
  }

  return respondWithCount(() => applyMark(request, { mark, externalIds: selection.externalIds, date }));
}
