import type { ActionFunctionArgs } from 'react-router';

import { handleCreateRequest } from '~/features/discs/submission/handleCreateRequest.server';

/**
 * Persists a batch of hand-added discs.
 *
 * A resource route (no default export) rather than an action on /discs/add: a
 * plain `fetch` POST to a page route is a document request, so React Router
 * answers it with the rendered HTML page and the JSON below never reaches the
 * caller.
 * A resource route returns its action's response as-is.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleCreateRequest(request);
}
