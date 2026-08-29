import { getDiscWithFullPhoneNumber } from '~/models/discs.server';
import { getSentMessages } from '~/models/messageLog.server';
import { getMessageTemplates } from '~/models/messageTemplate.server';

/** Everything the "send a message" page needs for one disc. */
export async function loadSendMessagePage(request: Request, discId: number) {
  const [messageTemplates, sentMessages, data] = await Promise.all([
    getMessageTemplates(request),
    getSentMessages(discId, request),
    getDiscWithFullPhoneNumber(discId),
  ]);

  return { data, messageTemplates, sentMessages };
}
