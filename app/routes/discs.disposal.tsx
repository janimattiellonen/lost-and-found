import type { ActionFunctionArgs } from 'react-router';

import { handleDisposalRequest } from '~/features/discs/disposal/handleDisposalRequest.server';

/**
 * Marks one disc as free to be sold or donated.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleDisposalRequest(request);
}
