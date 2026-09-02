import type { MessageLogDTO } from '~/types';

export function toDTO(raw: any): MessageLogDTO {
  return {
    id: raw.id,
    sentAt: raw.sent_at,
    externalId: raw.external_id,
    clubId: raw.club_id,
    content: raw.content,
  };
}
