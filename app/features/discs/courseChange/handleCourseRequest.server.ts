import { getDiscCourseNames } from '~/config/courses';
import { markRefusal, requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId } from '~/lib/api/validate';
import { setDiscCourse } from '~/models/discs.server';

/**
 * Authorises, validates and applies a course change posted to /discs/course.
 *
 * The course is checked against the ones this club actually collects from,
 * rather than written through as typed: a stray value would become an extra
 * option in the list page's course filter, which is the same reason the add
 * form validates it.
 */
export async function handleCourseRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const { externalId, course } = (gate.body ?? {}) as Record<string, unknown>;

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 422 });
  }

  // Null is the deliberate "no course" choice, so it skips the list check.
  if (course !== null && typeof course !== 'string') {
    return Response.json({ error: 'Virheellinen rata.' }, { status: 422 });
  }

  const allowedCourses = getDiscCourseNames(parseInt(process.env.APP_CLUB_ID!, 10));

  if (course !== null && !allowedCourses.includes(course)) {
    return Response.json({ error: `Tuntematon rata "${course}".` }, { status: 422 });
  }

  try {
    const outcome = await setDiscCourse(externalId, course, request);

    const refusal = markRefusal(outcome);

    if (refusal) {
      return refusal;
    }

    return Response.json({ marked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Radan tallennus epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
