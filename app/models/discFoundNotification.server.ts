import { createConnection, createSupabaseServerClient } from '~/models/utils';
import { toDTO } from '~/models/DiscFoundNotificationMapper';
import { DiscFoundNotificationDTO } from '~/types';
import process from 'process';

export async function createDiscFoundNotification(data: {
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  message?: string | null;
  courseName?: string | null;
}): Promise<void> {
  const supabase = createConnection();
  const clubId = process.env.APP_CLUB_ID;

  const { error } = await supabase
    .from('disc_found_notifications')
    .insert({
      club_id: clubId,
      course_name: data.courseName || null,
      contact_name: data.contactName || null,
      contact_phone: data.contactPhone || null,
      contact_email: data.contactEmail || null,
      message: data.message || null,
    });

  if (error) {
    console.error('Failed to create disc found notification:', error.message);
  }
}

export async function getDiscFoundNotifications(request: Request): Promise<DiscFoundNotificationDTO[]> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  const { data } = await supabase
    .from('disc_found_notifications')
    .select('id, created_at, club_id, course_name, contact_name, contact_phone, contact_email, message, read_at')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  return data ? data.map((row: any) => toDTO(row)) : [];
}

export async function markNotificationAsRead(id: number, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  await supabase
    .from('disc_found_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('club_id', clubId);
}

export async function deleteNotification(id: number, request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);
  const clubId = process.env.APP_CLUB_ID;

  await supabase
    .from('disc_found_notifications')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId);
}
