import type { ActionFunctionArgs } from 'react-router';

import { handleRetrievalRequest } from '~/features/discs/retrieval/handleRetrievalRequest.server';

/**
 * Puts one disc on the admin's retrieval list.
 *
 * A resource route for the same reason as /discs/return: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleRetrievalRequest(request);
}
