import { DiscFoundNotificationDTO } from '~/types';

export function toDTO(raw: any): DiscFoundNotificationDTO {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    clubId: raw.club_id,
    courseName: raw.course_name,
    contactName: raw.contact_name,
    contactPhone: raw.contact_phone,
    contactEmail: raw.contact_email,
    message: raw.message,
    readAt: raw.read_at,
  };
}
