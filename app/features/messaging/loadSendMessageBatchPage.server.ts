import { redirect } from 'react-router';

import type { ComposerDisc, ComposerMessage } from '~/features/messaging/composerData';
import { MAX_BATCH_SIZE, parseBatchIds } from '~/features/messaging/sendBatchSelection';
import { getDiscsWithFullPhoneNumbers } from '~/models/discs.server';
import { getSentMessagesByDisc } from '~/models/messageLog.server';
import { getMessageTemplates } from '~/models/messageTemplate.server';

/**
 * Everything the batch send page needs: the selected discs in the order the
 * admin picked them, the message templates, and each disc's sent history.
 *
 * An empty or unusable selection is nothing to do, and the admin goes back to
 * the list. A selection over the cap is reported rather than cut short, so the
 * page can say so with a way out instead of the batch quietly shrinking.
 *
 * Fields are listed one by one rather than whole rows going over the wire:
 * these carry the owner's full phone number, which no more of the page than
 * this needs.
 */
export async function loadSendMessageBatchPage(request: Request) {
  const externalIds = parseBatchIds(new URL(request.url).searchParams.get('ids'));

  if (externalIds.length === 0) {
    throw redirect('/');
  }

  if (externalIds.length > MAX_BATCH_SIZE) {
    return {
      tooMany: { selected: externalIds.length, max: MAX_BATCH_SIZE },
      discs: [] as ComposerDisc[],
      messageTemplates: [],
      sentMessagesByDisc: {} as Record<string, ComposerMessage[]>,
    };
  }

  const [messageTemplates, found] = await Promise.all([
    getMessageTemplates(request),
    getDiscsWithFullPhoneNumbers(externalIds),
  ]);

  // Read for the discs that were actually found, so an id that no longer
  // resolves does not widen the query.
  const sentMessages = await getSentMessagesByDisc(
    found.map((disc) => disc.externalId).filter((externalId): externalId is string => externalId != null),
    request,
  );

  const sentMessagesByDisc: Record<string, ComposerMessage[]> = {};

  Object.entries(sentMessages).forEach(([externalId, messages]) => {
    sentMessagesByDisc[externalId] = messages.map((message) => ({
      content: message.content,
      sentAt: message.sentAt,
    }));
  });

  const discs: ComposerDisc[] = found.map((disc) => ({
    externalId: disc.externalId,
    discName: disc.discName,
    discColour: disc.discColour,
    ownerName: disc.ownerName,
    ownerPhoneNumber: disc.ownerPhoneNumber,
    notifiedAt: disc.notifiedAt,
  }));

  return { tooMany: null, discs, messageTemplates, sentMessagesByDisc };
}
