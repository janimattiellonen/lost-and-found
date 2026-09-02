import { getDiscWithFullPhoneNumber } from '~/models/discs.server';
import { getSentMessages } from '~/models/messageLog.server';
import { getMessageTemplates } from '~/models/messageTemplate.server';

/**
 * Everything the "send a message" page needs for one disc, addressed by its
 * external id.
 *
 * Throws a 404 response for an id this club has no disc for, rather than
 * rendering the page around an absent disc.
 */
export async function loadSendMessagePage(request: Request, externalId: string) {
  const [messageTemplates, sentMessages, data] = await Promise.all([
    getMessageTemplates(request),
    getSentMessages(externalId, request),
    getDiscWithFullPhoneNumber(externalId),
  ]);

  if (!data) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  return { data, messageTemplates, sentMessages };
}
