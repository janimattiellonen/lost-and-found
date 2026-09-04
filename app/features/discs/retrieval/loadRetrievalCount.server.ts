import type { SupabaseClient } from '@supabase/supabase-js';

import { queryRetrievalCount } from './queryRetrievalCount.server';
import { menuCount } from '~/lib/menuCount.server';

/**
 * How many discs are waiting to be fetched, for the count beside the menu item.
 *
 * Null when there is no menu item, which now means only one thing: nobody is
 * signed in.
 */
export async function loadRetrievalCount(supabase: SupabaseClient, isSignedIn: boolean): Promise<number | null> {
  return menuCount(supabase, isSignedIn, queryRetrievalCount);
}
