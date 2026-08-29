import { markAsSent } from '~/models/messageLog.server';

/** Records that the message shown on the page was sent to the disc's owner. */
export async function recordMessageSent(request: Request, form: FormData) {
  const id = form.get('id');
  const content = form.get('content');

  await markAsSent(parseInt(id ? id.toString() : '', 10), content ? content.toString() : '', request);

  return { ok: true };
}
