import { redirect } from 'react-router';

import { currentClubId } from '~/config/clubs';
import { getDiscCourseNames } from '~/config/courses';
import { courseOptions } from '~/features/discs/edit/courseOptions';
import { queryDiscForEdit } from '~/features/discs/edit/queryDiscForEdit.server';
import { RETURN_TO_PARAM, safeReturnTo } from '~/features/discs/edit/returnTo';
import { isExternalId } from '~/lib/api/validate';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * One disc's editable values, the courses its dropdown offers, and the page
 * "Peru" leads back to.
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
  return {
    disc,
    courses: courseOptions(getDiscCourseNames(clubId), disc.course),
    // Read from the address on every load, the save's included: the form posts
    // back to its own address, query string and all, so the value survives a
    // save without riding along in a hidden field.
    returnTo: safeReturnTo(new URL(request.url).searchParams.get(RETURN_TO_PARAM)),
  };
}
