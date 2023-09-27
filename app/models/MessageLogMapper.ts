import { MessageLogDTO } from '~/types';

export function toDTO(raw: any): MessageLogDTO {
  return {
    id: raw.id,
    sentAt: raw.sent_at,
    internalDiscId: raw.internal_disc_id,
    clubId: raw.club_id,
    content: raw.content,
  };
}
