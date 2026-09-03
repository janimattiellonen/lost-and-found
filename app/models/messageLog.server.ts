import { createSupabaseServerClient } from '~/models/utils';

import process from 'process';

import type { MessageLogDTO } from '~/types';
import { toDTO } from '~/models/MessageLogMapper';

/** The columns behind a disc's sent-message history. */
const MESSAGE_LOG_COLUMNS = 'id, sent_at, external_id, club_id, content';

export async function markAsSent(externalId: string, content: string, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { error } = await supabase
    .from('message_log')
    .insert({ sent_at: 'now()', external_id: externalId, club_id: clubId, content: content })
    .select();

  console.log(`Error: ${JSON.stringify(error, null, 2)}`);
}

export async function getSentMessages(externalId: string, request: Request): Promise<MessageLogDTO[]> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('message_log')
    .select(MESSAGE_LOG_COLUMNS)
    .eq('external_id', externalId)
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}

/**
 * The sent messages for a batch of discs, keyed by external id.
 *
 * One query rather than one per disc: a selection of thirty discs would
 * otherwise be thirty round trips before the first message can be composed.
 */
export async function getSentMessagesByDisc(
  externalIds: string[],
  request: Request,
): Promise<Record<string, MessageLogDTO[]>> {
  if (externalIds.length === 0) {
    return {};
  }

  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('message_log')
    .select(MESSAGE_LOG_COLUMNS)
    .in('external_id', externalIds)
    .eq('club_id', clubId);

  const byDisc: Record<string, MessageLogDTO[]> = {};

  (data ?? []).forEach((row: any) => {
    const message = toDTO(row);

    byDisc[message.externalId] = [...(byDisc[message.externalId] ?? []), message];
  });

  return byDisc;
}
