import { createSupabaseServerClient } from '~/models/utils';

import process from 'process';

import { MessageLogDTO } from '~/types';
import { toDTO } from '~/models/MessageLogMapper';

export async function markAsSent(internalDiscId: number, content: string, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { data, error } = await supabase
    .from('message_log')
    .insert({ sent_at: 'now()', internal_disc_id: internalDiscId, club_id: clubId, content: content })
    .select();

  console.log(`Error: ${JSON.stringify(error, null, 2)}`);
}

export async function getSentMessages(internalDiscId: number, request: Request): Promise<MessageLogDTO[]> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { data, error } = await supabase
    .from('message_log')
    .select('id, sent_at, internal_disc_id, club_id, content')
    .eq('internal_disc_id', internalDiscId)
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}
