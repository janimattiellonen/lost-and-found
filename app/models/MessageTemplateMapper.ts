import type { MessageTemplateDTO } from '~/types';

export function toDTO(raw: any): MessageTemplateDTO {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    clubId: raw.club_id,
    content: raw.content,
    isDefault: raw.is_default,
    categoryId: raw.category_id ?? null,
    // The joined row, when the select asked for it. Absent rather than null on
    // a select that did not, which reads the same here.
    categoryName: raw.message_template_categories?.name ?? null,
  };
}
