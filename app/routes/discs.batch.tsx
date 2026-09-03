import type { ActionFunctionArgs } from 'react-router';

import { handleBatchRequest } from '~/features/discs/batch/handleBatchRequest.server';

/**
 * Applies one action — delete, returned, or free to be sold or donated — to a
 * selection of discs at once.
 *
 * A resource route for the same reason as /discs/delete: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleBatchRequest(request);
}
