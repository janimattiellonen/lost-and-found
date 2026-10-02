import type { ActionFunctionArgs } from 'react-router';

import { handlePhoneNumberRequest } from '~/features/messaging/handlePhoneNumberRequest.server';

/**
 * Saves one disc's phone number from the message composer's editor.
 *
 * A resource route rather than an action on the two composer routes: both need
 * the same save, and a plain fetch POST to a page route is answered with a
 * rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handlePhoneNumberRequest(request);
}
