import { createSupabaseServerClient } from '~/models/utils';

import { toDTO } from '~/models/MessageTemplateMapper';
import { MessageTemplateDTO } from '~/types';
import process from 'process';

export async function getMessageTemplates(request: Request): Promise<MessageTemplateDTO[]> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  const { data, error } = await supabase
    .from('message_templates')
    .select('id, created_at, updated_at, club_id, content, is_default')
    .eq('club_id', clubId)
    // .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}

export async function createMessageTemplate(
  content: string,
  isDefault: boolean,
  request: Request,
): Promise<number | null> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  if (isDefault) {
    await resetIsDefault(request);
  }

  const { data } = await supabase
    .from('message_templates')
    .insert({ club_id: clubId, content: content, is_default: isDefault })
    .select();

  return data ? data[0]['id'] : null;
}

export async function editMessageTemplate(
  id: number,
  content: string,
  isDefault: boolean,
  request: Request,
): Promise<void> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  if (isDefault) {
    await resetIsDefault(request);
  }

  await supabase
    .from('message_templates')
    .update({ is_default: isDefault, content: content })
    .eq('id', id)
    .eq('club_id', clubId);
}

export async function getMessageTemplate(id: number, request: Request): Promise<MessageTemplateDTO | null> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('message_templates')
    .select('id, created_at, updated_at, club_id, content, is_default')
    .eq('id', id)
    .eq('club_id', clubId)
    .single();

  return data ? toDTO(data) : null;
}

export async function deleteMessageTemplate(id: number, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;
  await supabase.from('message_templates').delete().eq('club_id', clubId).eq('id', id);
}

export async function markAsDefault(id: number, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;
  await resetIsDefault(request);

  await supabase.from('message_templates').update({ is_default: true }).eq('club_id', clubId).eq('id', id);
}

async function resetIsDefault(request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  await supabase.from('message_templates').update({ is_default: false }).eq('club_id', clubId).eq('is_default', true);
}
