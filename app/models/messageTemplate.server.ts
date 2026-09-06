import { createSupabaseServerClient } from '~/models/utils';

import { toDTO } from '~/models/MessageTemplateMapper';
import type { MessageTemplateDTO } from '~/types';
import process from 'process';

/**
 * The columns every template read asks for, including the category's name
 * through the foreign key so a list does not have to fetch the categories
 * separately just to label its cards.
 */
const TEMPLATE_COLUMNS =
  'id, created_at, updated_at, club_id, content, is_default, category_id, message_template_categories(name)';

export async function getMessageTemplates(request: Request): Promise<MessageTemplateDTO[]> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('message_templates')
    .select(TEMPLATE_COLUMNS)
    .eq('club_id', clubId)
    // .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}

/**
 * The club's templates in one category, or the ones in no category at all.
 *
 * `null` is not "any category": it means the templates whose `category_id` is
 * NULL, which is what a page falls back to when the category it wanted has been
 * deleted. See specs/06-messaging-and-templates.md.
 */
export async function getMessageTemplatesByCategory(
  categoryId: number | null,
  request: Request,
): Promise<MessageTemplateDTO[]> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  const query = supabase.from('message_templates').select(TEMPLATE_COLUMNS).eq('club_id', clubId);

  const { data } = await (
    categoryId === null ? query.is('category_id', null) : query.eq('category_id', categoryId)
  ).order('created_at', { ascending: false });

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}

/** A template as the create and edit forms describe one. */
type TemplateInput = {
  content: string;
  isDefault: boolean;
  /** Null for "Ei kategoriaa", which is what a new template starts on. */
  categoryId: number | null;
};

export async function createMessageTemplate(request: Request, input: TemplateInput): Promise<number | null> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  if (input.isDefault) {
    await resetIsDefault(request);
  }

  const { data } = await supabase
    .from('message_templates')
    .insert({ club_id: clubId, content: input.content, is_default: input.isDefault, category_id: input.categoryId })
    .select();

  return data ? data[0]['id'] : null;
}

export async function editMessageTemplate(request: Request, id: number, input: TemplateInput): Promise<void> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  if (input.isDefault) {
    await resetIsDefault(request);
  }

  await supabase
    .from('message_templates')
    .update({ is_default: input.isDefault, content: input.content, category_id: input.categoryId })
    .eq('id', id)
    .eq('club_id', clubId);
}

export async function getMessageTemplate(id: number, request: Request): Promise<MessageTemplateDTO | null> {
  const supabase = createSupabaseServerClient(request);

  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('message_templates')
    .select(TEMPLATE_COLUMNS)
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
