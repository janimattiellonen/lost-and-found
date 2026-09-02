import { isExternalId } from '~/lib/api/validate';
import { markAsSent } from '~/models/messageLog.server';

/** Records that the message shown on the page was sent to the disc's owner. */
export async function recordMessageSent(request: Request, form: FormData) {
  const externalId = form.get('externalId');
  const content = form.get('content');

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 400 });
  }

  await markAsSent(externalId, content ? content.toString() : '', request);

  return { ok: true };
}
