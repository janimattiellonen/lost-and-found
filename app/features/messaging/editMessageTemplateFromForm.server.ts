import { data } from 'react-router';

import type { MessageTemplateErrors } from '~/features/messaging/createMessageTemplateFromForm.server';
import { queryOwnCategoryId } from '~/features/messaging/categories/queryOwnCategoryId.server';
import { parseCategoryId } from '~/features/messaging/templateCategoryField';
import { editMessageTemplate } from '~/models/messageTemplate.server';
import { createSupabaseServerClient } from '~/models/utils';

/** Validates the edit form and saves the template, or replies with errors. */
export async function editMessageTemplateFromForm(request: Request, id: number, form: FormData) {
  const errors: MessageTemplateErrors = {};

  const content = form.get('content')!;
  const isDefault = form.get('is-default')!;

  if (typeof content !== 'string' || content.length === 0) {
    errors.content = 'Sisältö on pakollinen';
  }

  if (Object.keys(errors).length) {
    return data({ errors, ok: null }, { status: 422 });
  }

  await editMessageTemplate(request, id, {
    content: content.toString(),
    isDefault: isDefault ? Boolean(isDefault.toString()) : false,
    categoryId: await queryOwnCategoryId(createSupabaseServerClient(request), parseCategoryId(form.get('category-id'))),
  });

  return data({ errors: null, ok: true }, { status: 201 });
}
