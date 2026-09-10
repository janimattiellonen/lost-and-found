import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId, isIsoDate } from '~/lib/api/validate';
import { queryRequestDisposalRetrievals } from '~/features/discs/retrieval/queryRequestDisposalRetrievals.server';
import { deleteDiscs, markDiscsAsReturned, markDiscsForDisposal } from '~/models/discs.server';
import { createSupabaseServerClient } from '~/models/utils';

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

/**
 * What an action did: how many discs it reached, and what went wrong afterwards
 * that the admin still has to hear about.
 *
 * A warning is not an error. The discs were marked; a disposal's second write —
 * the retrieval errands — is what failed, and answering 500 would throw the
 * count away and tell the admin nothing happened, which would be the one thing
 * that is not true.
 */
type BatchOutcome = { affected: number; warning?: string };

type MarkInput = {
  mark: BatchMark;
  externalIds: string[];
  /** ISO date, y-MM-dd. */
  date: string;
};

/**
 * Applies a mark to the selection: which columns and which method both come
 * from the action's own row in the batch action table.
 *
 * A disposal mark also writes the retrieval errands. Both halves are reported:
 * the count when they both went through, and the count plus a warning when the
 * errands did not.
 */
async function applyMark(request: Request, { mark, externalIds, date }: MarkInput): Promise<BatchOutcome> {
  if (mark.columns === 'return') {
    return {
      affected: await markDiscsAsReturned(request, {
        externalIds,
        details: { returnedToOwnerDate: date, returnMethod: mark.method },
      }),
    };
  }

  const affected = await markDiscsForDisposal(request, {
    externalIds,
    details: { canBeSoldOrDonatedDate: date, canBeSoldOrDonatedMethod: mark.method },
  });

  // Every disc released for sale or donation is one to fetch off the shelf, a
  // selection of fifty as much as a single row action. Marking a disc from the
  // batch that is already on the list clears its method rather than adding a
  // second errand, the same as the single mark does.
  //
  // Nothing was marked, so there is nothing to fetch and nothing to warn about:
  // the shortfall the report already names is the whole story.
  if (affected === 0) {
    return { affected };
  }

  // The two writes are not one transaction, so a failure here comes back beside
  // the count rather than instead of it: the discs are marked, and it is the
  // list that is short. The sentence is the query's, not composed again here.
  try {
    await queryRequestDisposalRetrievals(createSupabaseServerClient(request), externalIds);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    return { affected, warning: error.message };
  }

  return { affected };
}

/**
 * Answers with how many discs the action reached — plus, for a disposal whose
 * errands did not follow, the warning that says so — or with why it could not
 * run at all.
 */
async function respondWithOutcome(apply: () => Promise<BatchOutcome>): Promise<Response> {
  try {
    return Response.json(await apply());
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
    return respondWithOutcome(async () => ({ affected: await deleteDiscs(request, selection.externalIds) }));
  }

  if (!isIsoDate(date)) {
    return Response.json({ error: 'Virheellinen päivämäärä.' }, { status: 422 });
  }

  return respondWithOutcome(() => applyMark(request, { mark, externalIds: selection.externalIds, date }));
}
