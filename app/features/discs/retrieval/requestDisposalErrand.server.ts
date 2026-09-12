import type { SupabaseClient } from '@supabase/supabase-js';

import { queryRequestDisposalRetrievals } from './queryRequestDisposalRetrievals.server';

/**
 * Puts one disc the club has just released on the retrieval list, and reports
 * what to tell the admin if that half failed.
 *
 * Returns null when the errand was written, or the sentence to show when it was
 * not. Neither the mark nor the errand is rolled back: the two are not one
 * transaction, and the disc really is marked, so the message has to say that
 * only the errand is missing — an admin told "it failed" would redo a mark that
 * already happened.
 *
 * Written once and called from both places that release a disc — the disc
 * list's row action and the edit form — so the two cannot come to disagree
 * about what a release does, which is exactly what they had started to do.
 */
export async function requestDisposalErrand(supabase: SupabaseClient, externalId: string): Promise<string | null> {
  try {
    await queryRequestDisposalRetrievals(supabase, [externalId]);

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Noutolistalle lisääminen epäonnistui.';
  }
}
