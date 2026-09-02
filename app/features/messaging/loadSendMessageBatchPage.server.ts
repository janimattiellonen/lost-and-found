import { redirect } from 'react-router';

import { getDiscsWithFullPhoneNumbers } from '~/models/discs.server';
import { getSentMessagesByDisc } from '~/models/messageLog.server';
import { getMessageTemplates } from '~/models/messageTemplate.server';
import { MAX_BATCH_SIZE, parseBatchIds } from '~/lib/messageBatchUrl';

/**
 * Everything the batch send page needs: the selected discs in the order the
 * admin picked them, the message templates, and each disc's sent history.
 *
 * A selection larger than the cap is refused rather than cut short, so the
 * page never claims to be working through a batch it has quietly shortened.
 * An empty or unusable selection is nothing to do, and the caller sends the
 * admin back to the list.
 */
export async function loadSendMessageBatchPage(request: Request) {
  const externalIds = parseBatchIds(new URL(request.url).searchParams.get('ids'));

  // Nothing selected, or nothing that could be an external id: there is no
  // batch to work through, so back to the list rather than an empty page.
  if (externalIds.length === 0) {
    throw redirect('/');
  }

  if (externalIds.length > MAX_BATCH_SIZE) {
    throw new Response(`Liian monta kiekkoa valittuna (enintään ${MAX_BATCH_SIZE}).`, { status: 400 });
  }

  const [messageTemplates, discs] = await Promise.all([
    getMessageTemplates(request),
    getDiscsWithFullPhoneNumbers(externalIds),
  ]);

  // Read for the discs that were actually found, so an id that no longer
  // resolves does not widen the query.
  const sentMessagesByDisc = await getSentMessagesByDisc(
    discs.map((disc) => disc.externalId).filter((externalId): externalId is string => externalId != null),
    request,
  );

  return { discs, messageTemplates, sentMessagesByDisc };
}
