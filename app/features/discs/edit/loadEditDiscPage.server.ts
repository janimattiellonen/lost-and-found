import { redirect } from 'react-router';

import { currentClubId } from '~/config/clubs';
import { getDiscCourseNames } from '~/config/courses';
import { queryDiscForEdit } from '~/features/discs/edit/queryDiscForEdit.server';
import { isExternalId } from '~/lib/api/validate';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * One disc's editable values and the courses its dropdown offers.
 *
 * Admin-only: an anonymous request is sent to the sign-in page before anything
 * is read, because the owner's whole phone number is part of what comes back.
 * A uuid this club has no disc for answers 404 rather than an empty form.
 */
export async function loadEditDiscPage(request: Request, externalId: string | undefined) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  if (!isExternalId(externalId)) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  const clubId = currentClubId();

  const disc = await queryDiscForEdit(createSupabaseServerClient(request), { externalId, clubId });

  if (!disc) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  // `disc` is already a field-by-field projection built in queryDiscForEdit, not
  // the database row: the columns the form cannot write — the owner link token
  // above all — are never read, let alone sent.
  return { disc, courses: getDiscCourseNames(clubId) };
}
