import { data } from 'react-router';

import type { MessageTemplateErrors } from '~/features/messaging/createMessageTemplateFromForm.server';
import { editMessageTemplate } from '~/models/messageTemplate.server';

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

  await editMessageTemplate(id, content.toString(), isDefault ? Boolean(isDefault.toString()) : false, request);

  return data({ errors: null, ok: true }, { status: 201 });
}
