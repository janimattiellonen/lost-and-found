import type { MessageTemplateCategoryDTO } from '~/types';

/**
 * The columns every category query reads back, in one place so the select
 * string and the row type below cannot drift apart.
 */
export const CATEGORY_COLUMNS = 'id, club_id, name';

/** What `CATEGORY_COLUMNS` returns. A select built from a string cannot be typed by supabase-js. */
export type CategoryRow = {
  id: number;
  club_id: number;
  name: string;
};

export function toCategory(row: CategoryRow): MessageTemplateCategoryDTO {
  return { id: row.id, clubId: row.club_id, name: row.name };
}

/**
 * The database's unique-violation code. The create and rename actions let the
 * unique index on `(club_id, lower(name))` decide whether a name is taken,
 * rather than reading the table first: two admins saving the same name at the
 * same moment would both pass a pre-check.
 */
export const UNIQUE_VIOLATION = '23505';

/** Whether a category write went through, or which way it did not. */
export type CategoryWriteResult = { ok: true } | { ok: false; reason: 'duplicate' | 'failed' };
