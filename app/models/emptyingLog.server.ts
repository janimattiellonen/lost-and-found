import { createSupabaseServerClient } from '~/models/utils';

import { toDTO } from '~/models/EmptyingLogMapper';

export async function getEmptyingLogItems(request: Request) {
  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from('emptying_log')
    .select('id, created_at, emptied_at, club_id, course_name');

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}

export async function markAsEmptied(courseId: number, request: Request) {
  const supabase = createSupabaseServerClient(request);

  const { error } = await supabase.from('emptying_log').update({ emptied_at: 'now()' }).eq('id', courseId);

  return [];
}

export async function getEmptyingLogItemsForClub(clubId: number, request: Request) {
  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from('emptying_log')
    .select('id, created_at, club_id, course_name, emptied_at')
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}
