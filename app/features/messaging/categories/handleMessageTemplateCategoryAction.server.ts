import { data } from 'react-router';

import { parseCategoryId } from '~/features/messaging/templateCategoryField';
import { createSupabaseServerClient } from '~/models/utils';
import type { CategoryWriteResult } from './categoryWriteResult.server';
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
const NOT_FOUND = 'Kategoriaa ei löytynyt';

/**
 * Applies one intent posted from the category admin tool: add, rename or
 * delete.
 *
 * Each of the three is matched by name and anything else is refused. An earlier
 * shape fell through to "add", which turned a typo in a hidden field into a new
 * category.
 */
export async function handleMessageTemplateCategoryAction(request: Request, form: FormData) {
  const supabase = createSupabaseServerClient(request);
  const action = form.get('action');

  // Trimmed before anything looks at it, so " Vastaus" and "Vastaus" cannot
  // become two categories that read identically in a dropdown.
  const name = (form.get('name') ?? '').toString().trim();

  if (action === 'create') {
    return name.length === 0
      ? errorResponse({ categoryId: null, message: NAME_REQUIRED })
      : report(null, await queryCreateMessageTemplateCategory(supabase, name));
  }

  // The same parse the composer's `?category=` goes through: only a positive
  // whole number is an id, and anything else is refused here rather than handed
  // to PostgREST as a NaN.
  const id = parseCategoryId(form.get('id'));

  if (id === null || (action !== 'rename' && action !== 'delete')) {
    return errorResponse({ categoryId: null, message: SAVE_FAILED });
  }

  if (action === 'delete') {
    return report(id, await queryDeleteMessageTemplateCategory(supabase, id));
  }

  return name.length === 0
    ? errorResponse({ categoryId: id, message: NAME_REQUIRED })
    : report(id, await queryRenameMessageTemplateCategory(supabase, { id, name }));
}

/** Turns one write's outcome into what the page shows. */
function report(categoryId: number | null, result: CategoryWriteResult) {
  if (result.ok) {
    return { error: null };
  }

  const message = result.reason === 'duplicate' ? NAME_TAKEN : result.reason === 'missing' ? NOT_FOUND : SAVE_FAILED;

  return errorResponse({ categoryId, message });
}

function errorResponse(error: CategoryError) {
  return data({ error }, { status: 422 });
}
