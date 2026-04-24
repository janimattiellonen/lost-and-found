import { createConnection, createSupabaseServerClient } from '~/models/utils';
import { toDTO } from '~/models/BinFullNotificationMapper';
import type { BinFullNotificationDTO } from '~/types';
import process from 'process';

export async function createBinFullNotification(data: { courseName: string }): Promise<void> {
  const supabase = createConnection();
  const clubId = process.env.APP_CLUB_ID;

  const { error } = await supabase.from('bin_full_notifications').insert({
    club_id: clubId,
    course_name: data.courseName,
  });

  if (error) {
    console.error('Failed to create bin full notification:', error.message);
  }
}

export async function getBinFullNotifications(request: Request): Promise<BinFullNotificationDTO[]> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('bin_full_notifications')
    .select('id, created_at, club_id, course_name, read_at')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  return data ? data.map((row: any) => toDTO(row)) : [];
}

export async function markBinFullNotificationAsRead(id: number, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  await supabase
    .from('bin_full_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('club_id', clubId);
}

export async function deleteBinFullNotification(id: number, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  await supabase.from('bin_full_notifications').delete().eq('id', id).eq('club_id', clubId);
}

export async function deleteAllBinFullNotifications(request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);

  await supabase.from('bin_full_notifications').delete().gte('id', 0);
}
