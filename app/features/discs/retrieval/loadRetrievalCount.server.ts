import type { SupabaseClient } from '@supabase/supabase-js';

import { isRetrievalListEnabled } from '~/config/clubs';
import { queryRetrievalCount } from './queryRetrievalCount.server';
import { menuCount } from '~/lib/menuCount.server';

/**
 * How many discs are waiting to be fetched from the club's storage, for the
 * count beside the menu item.
 *
 * Null when there is no menu item: nobody is signed in, or this club keeps no
 * retrieval list.
 */
export async function loadRetrievalCount(supabase: SupabaseClient, isSignedIn: boolean): Promise<number | null> {
  if (!isRetrievalListEnabled()) {
    return null;
  }

  return menuCount(supabase, isSignedIn, queryRetrievalCount);
}
