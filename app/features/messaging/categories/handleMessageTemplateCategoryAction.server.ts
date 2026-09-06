import { data } from 'react-router';

import { createSupabaseServerClient } from '~/models/utils';
import type { CategoryWriteResult } from './categoryColumns';
import { queryCreateMessageTemplateCategory } from './queryCreateMessageTemplateCategory.server';
import { queryDeleteMessageTemplateCategory } from './queryDeleteMessageTemplateCategory.server';
import { queryRenameMessageTemplateCategory } from './queryRenameMessageTemplateCategory.server';

/**
 * A failed save, and which field it belongs beside.
 *
 * `categoryId` is null for the "add a category" field at the top of the page,
 * and a row id when it was that row's own name field that would not save.
 */
export type CategoryError = {
  categoryId: number | null;
  message: string;
};

const NAME_REQUIRED = 'Nimi on pakollinen';
const NAME_TAKEN = 'Samanniminen kategoria on jo olemassa';
const SAVE_FAILED = 'Tallennus epäonnistui';

/** Applies one intent posted from the category admin tool: add, rename or delete. */
export async function handleMessageTemplateCategoryAction(request: Request, form: FormData) {
  const supabase = createSupabaseServerClient(request);
  const action = form.get('action');
  const id = Number(form.get('id'));

  if (action === 'delete') {
    await queryDeleteMessageTemplateCategory(supabase, id);

    return { error: null };
  }

  // Trimmed before anything looks at it, so " Vastaus" and "Vastaus" cannot
  // become two categories that read identically in a dropdown.
  const name = (form.get('name') ?? '').toString().trim();
  const field = action === 'rename' ? id : null;

  if (name.length === 0) {
    return errorResponse({ categoryId: field, message: NAME_REQUIRED });
  }

  const result: CategoryWriteResult =
    action === 'rename'
      ? await queryRenameMessageTemplateCategory(supabase, { id, name })
      : await queryCreateMessageTemplateCategory(supabase, name);

  if (result.ok) {
    return { error: null };
  }

  return errorResponse({
    categoryId: field,
    message: result.reason === 'duplicate' ? NAME_TAKEN : SAVE_FAILED,
  });
}

function errorResponse(error: CategoryError) {
  return data({ error }, { status: 422 });
}
