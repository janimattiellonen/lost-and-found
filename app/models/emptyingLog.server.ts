import { createSupabaseServerClient } from '~/models/utils';

import { toDTO } from '~/models/EmptyingLogMapper';

export async function getEmptyingLogItems(request: Request) {
  const supabase = createSupabaseServerClient(request);

  const { data } = await supabase.from('emptying_log').select('id, created_at, emptied_at, club_id, course_name');

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}

type MarkAsEmptiedInput = {
  courseId: number;
  emptiedAt?: string;
};

/**
 * Records an emptying for one log row. `emptiedAt` is an ISO `y-MM-dd` date the
 * admin picked by hand; without it Postgres stamps the current time.
 */
export async function markAsEmptied(request: Request, { courseId, emptiedAt }: MarkAsEmptiedInput) {
  const supabase = createSupabaseServerClient(request);

  await supabase
    .from('emptying_log')
    .update({ emptied_at: emptiedAt ?? 'now()' })
    .eq('id', courseId);

  return [];
}

export async function getEmptyingLogItemsForClub(clubId: number, request: Request) {
  const supabase = createSupabaseServerClient(request);

  const { data } = await supabase
    .from('emptying_log')
    .select('id, created_at, club_id, course_name, emptied_at')
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        return toDTO(row);
      })
    : [];
}
