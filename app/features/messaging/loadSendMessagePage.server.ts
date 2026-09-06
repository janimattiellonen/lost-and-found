import { queryMessageTemplateCategoryById } from '~/features/messaging/categories/queryMessageTemplateCategoryById.server';
import { getDiscWithFullPhoneNumber } from '~/models/discs.server';
import { getSentMessages } from '~/models/messageLog.server';
import { getMessageTemplates, getMessageTemplatesByCategory } from '~/models/messageTemplate.server';
import { createSupabaseServerClient } from '~/models/utils';

import type { MessageTemplateDTO } from '~/types';

type Input = {
  externalId: string;
  /**
   * The category whose templates the dropdown should offer, from the page's
   * `?category=` parameter. Null when the page was opened without one — the
   * disc list's message icon — and the dropdown then offers everything, as it
   * always has.
   */
  categoryId: number | null;
};

/**
 * Everything the "send a message" page needs for one disc, addressed by its
 * external id.
 *
 * Throws a 404 response for an id this club has no disc for, rather than
 * rendering the page around an absent disc.
 */
export async function loadSendMessagePage(request: Request, input: Input) {
  const [messageTemplates, sentMessages, data] = await Promise.all([
    templatesFor(request, input.categoryId),
    getSentMessages(input.externalId, request),
    getDiscWithFullPhoneNumber(input.externalId),
  ]);

  if (!data) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  // The origin the admin actually loaded the page from, so a link pasted into
  // an sms points at the same host rather than at a configured guess.
  return { data, messageTemplates, sentMessages, baseUrl: new URL(request.url).origin };
}

/**
 * The templates the dropdown offers.
 *
 * An id that names no category of this club — deleted, another club's, or never
 * real — falls back to the templates in *no* category rather than to all of
 * them. Falling back to all would silently undo the narrowing this page was
 * opened for, and an empty dropdown would read as a broken page; the
 * uncategorised templates are also exactly where the deleted category's own
 * templates have just landed, by `ON DELETE SET NULL`.
 */
async function templatesFor(request: Request, categoryId: number | null): Promise<MessageTemplateDTO[]> {
  if (categoryId === null) {
    return getMessageTemplates(request);
  }

  const category = await queryMessageTemplateCategoryById(createSupabaseServerClient(request), categoryId);

  return getMessageTemplatesByCategory(category ? category.id : null, request);
}
