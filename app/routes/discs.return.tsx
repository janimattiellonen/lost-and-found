import type { ActionFunctionArgs } from 'react-router';

import { handleReturnRequest } from '~/features/discs/return/handleReturnRequest.server';

/**
 * Marks one disc as returned to its owner.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleReturnRequest(request);
}
