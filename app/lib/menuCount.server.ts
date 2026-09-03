import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * A count for a menu item, or null when there is no item to put one beside.
 *
 * Read on every page load, so a failure gives back null rather than an error
 * page for the whole app — the item is then simply absent, which is what a
 * signed-out visitor sees anyway. A menu decoration is never worth a 500.
 */
export async function menuCount(
  supabase: SupabaseClient,
  isSignedIn: boolean,
  count: (supabase: SupabaseClient) => Promise<number>,
): Promise<number | null> {
  if (!isSignedIn) {
    return null;
  }

  try {
    return await count(supabase);
  } catch {
    return null;
  }
}
