import { format } from 'date-fns';

import { postJson } from '~/lib/api/postJson';

import type { BatchAction } from './batchAction';

/** The resource route that applies the action. */
const BATCH_URL = '/discs/batch';

const GENERIC_ERROR = 'Toimenpide epäonnistui. Yritä uudelleen.';

/**
 * How many discs the action reached, or why it did not run.
 *
 * A success may still carry a warning: the discs were written and something
 * after that was not, which the admin has to hear without being told the action
 * failed.
 */
export type BatchActionResult =
  | { status: 'success'; affected: number; warning: string | null }
  | { status: 'error'; message: string };

/**
 * Applies one action to a selection of discs.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 *
 * The date the marks record is today's, taken from the browser rather than the
 * server: the server runs in UTC, which is the wrong day for a Finnish evening.
 * The single-disc forms date a mark the same way.
 */
export async function runBatchAction(action: BatchAction, externalIds: string[]): Promise<BatchActionResult> {
  const result = await postJson(BATCH_URL, { action, externalIds, date: format(new Date(), 'y-MM-dd') }, GENERIC_ERROR);

  if (result.status === 'error') {
    return result;
  }

  const { affected, warning } = (result.body ?? {}) as { affected?: unknown; warning?: unknown };

  // The route reports a count on every path it answers 200 on, so a body
  // without one never came from it.
  if (typeof affected !== 'number') {
    return { status: 'error', message: GENERIC_ERROR };
  }

  return { status: 'success', affected, warning: typeof warning === 'string' ? warning : null };
}
