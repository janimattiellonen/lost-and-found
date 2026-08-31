import type { ActionFunctionArgs } from 'react-router';

import { handleCourseRequest } from '~/features/discs/courseChange/handleCourseRequest.server';

/**
 * Files one disc under a course, or clears the one it has.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleCourseRequest(request);
}
