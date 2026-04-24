import type { BinFullNotificationDTO } from '~/types';

export function toDTO(raw: any): BinFullNotificationDTO {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    clubId: raw.club_id,
    courseName: raw.course_name,
    readAt: raw.read_at,
  };
}
