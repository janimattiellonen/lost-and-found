import { deleteMessageTemplate, markAsDefault } from '~/models/messageTemplate.server';

/** Applies one list-level intent posted from the message template list. */
export async function handleMessageTemplateAction(request: Request, formData: FormData) {
  const id = Number(formData.get('id'));
  const action = formData.get('action');

  if (action === 'delete') {
    await deleteMessageTemplate(id, request);
  } else if (action === 'default') {
    await markAsDefault(id, request);
  }

  return { ok: true };
}
