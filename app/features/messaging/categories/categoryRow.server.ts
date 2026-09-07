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
