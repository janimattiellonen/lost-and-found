import { type ActionResult, postJson } from '~/lib/api/postJson';

import type { DiscCourseInput } from './discCourse';

/** The resource route that records the course. */
const COURSE_URL = '/discs/course';

const GENERIC_ERROR = 'Radan tallennus epäonnistui. Yritä uudelleen.';

/**
 * Files one disc under a course, or clears the one it has.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function setDiscCourse(input: DiscCourseInput): Promise<ActionResult> {
  const result = await postJson(COURSE_URL, input, GENERIC_ERROR);

  return result.status === 'success' ? { status: 'success' } : result;
}

export type { DiscCourseInput };
