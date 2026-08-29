import type { ActionFunctionArgs } from 'react-router';

import { handleDeleteRequest } from '~/features/discs/deletion/handleDeleteRequest.server';

/**
 * Deletes one disc, addressed by its external id.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleDeleteRequest(request);
}
