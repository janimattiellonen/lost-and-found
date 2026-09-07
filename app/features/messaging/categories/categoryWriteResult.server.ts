import type { PostgrestError } from '@supabase/supabase-js';

/** Whether a category write went through, or which way it did not. */
export type CategoryWriteResult = { ok: true } | { ok: false; reason: 'duplicate' | 'missing' | 'failed' };

/**
 * The database's unique-violation code. Adding and renaming both let the unique
 * index on `(club_id, lower(name))` decide whether a name is taken, rather than
 * reading the table first: two admins saving the same name at the same moment
 * would both pass a pre-check.
 */
const UNIQUE_VIOLATION = '23505';

/**
 * One error, read the same way by every category write.
 *
 * `rowsAffected` is what tells a rename or a delete that it matched nothing —
 * an id of another club, or one already deleted. PostgREST reports no error for
 * that, because filtering a row out is not a failure to it, so without this
 * check the admin would be shown a saved page still carrying the old name.
 */
export function toWriteResult(error: PostgrestError | null, rowsAffected: number): CategoryWriteResult {
  if (error) {
    return { ok: false, reason: error.code === UNIQUE_VIOLATION ? 'duplicate' : 'failed' };
  }

  return rowsAffected > 0 ? { ok: true } : { ok: false, reason: 'missing' };
}
