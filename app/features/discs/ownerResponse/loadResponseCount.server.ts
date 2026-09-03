import type { SupabaseClient } from '@supabase/supabase-js';

import { queryUnhandledOwnerResponseCount } from './queryUnhandledOwnerResponseCount.server';
import { menuCount } from '~/lib/menuCount.server';

/**
 * How many owner answers are waiting, for the count beside the menu item.
 *
 * Null when there is no menu item, which here means nobody is signed in. A
 * wrapper around one call, so that root reads both counts the same way rather
 * than one through a feature and one through the plumbing — every club has this
 * page, unlike the retrieval list.
 */
export async function loadResponseCount(supabase: SupabaseClient, isSignedIn: boolean): Promise<number | null> {
  return menuCount(supabase, isSignedIn, queryUnhandledOwnerResponseCount);
}
