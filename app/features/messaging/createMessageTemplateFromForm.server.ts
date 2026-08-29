import { data, redirect } from 'react-router';

import { createMessageTemplate } from '~/models/messageTemplate.server';

export type MessageTemplateErrors = {
  content?: string | null | undefined;
};

/** Validates the create form and stores a new template, or replies with errors. */
export async function createMessageTemplateFromForm(request: Request, form: FormData) {
  const errors: MessageTemplateErrors = {};

  const content = form.get('content')!;
  const isDefault = form.get('is-default')!;

  if (typeof content !== 'string' || content.length === 0) {
    errors.content = 'Sisältö on pakollinen';
  }

  if (Object.keys(errors).length) {
    return data({ errors, data: null }, { status: 422 });
  }

  const messageTemplateId = await createMessageTemplate(
    content.toString(),
    isDefault ? Boolean(isDefault.toString()) : false,
    request,
  );

  return redirect(`/message-template/${messageTemplateId}/edit`, {
    status: 302,
  });
}
