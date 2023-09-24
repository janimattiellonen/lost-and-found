import { MessageTemplateDTO } from '~/types';

export function toDTO(raw: any): MessageTemplateDTO {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    clubId: raw.club_id,
    content: raw.content,
    isDefault: raw.is_default,
  };
}
