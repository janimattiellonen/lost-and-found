import { data, redirect } from 'react-router';

import { currentClubId } from '~/config/clubs';
import { getDiscCourseNames } from '~/config/courses';
import { courseOptions } from '~/features/discs/edit/courseOptions';
import { validateDiscEdit, type DiscEditErrors } from '~/features/discs/edit/discEdit';
import { queryDiscForEdit } from '~/features/discs/edit/queryDiscForEdit.server';
import { queryUpdateDisc } from '~/features/discs/edit/queryUpdateDisc.server';
import { requestDisposalErrand } from '~/features/discs/retrieval/requestDisposalErrand.server';
import { isExternalId } from '~/lib/api/validate';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * Validates the edit form and saves the disc, or replies with a message per bad
 * field.
 *
 * The session is checked here as well as in the loader: an action is its own
 * request, and a page rendered while signed in can be posted from long after
 * the cookie expired.
 */
export async function editDiscFromForm(request: Request, externalId: string | undefined, form: FormData) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  if (!isExternalId(externalId)) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  const clubId = currentClubId();
  const supabase = createSupabaseServerClient(request);

  // Read before write, for the course alone: a disc may be filed under a course
  // this club no longer collects from, the form offers that value back, and the
  // save has to accept it. See courseOptions for why.
  const stored = await queryDiscForEdit(supabase, { externalId, clubId });

  if (!stored) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  const result = validateDiscEdit(form, courseOptions(getDiscCourseNames(clubId), stored.course));

  if (result.errors) {
    return data({ errors: result.errors, ok: null }, { status: 422 });
  }

  let outcome;

  try {
    outcome = await queryUpdateDisc(supabase, { externalId, clubId, values: result.values });
  } catch (error) {
    const errors: DiscEditErrors = {
      form: error instanceof Error ? error.message : 'Kiekon tallennus epäonnistui.',
    };

    return data({ errors, ok: null }, { status: 500 });
  }

  // The disc was there a moment ago, so this is the race: deleted, archived out
  // of this club, or a policy refusing the write between the read and the save.
  if (outcome === 'not-found') {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  // The same second write the disc list's disposal action makes: a released
  // disc is off the public list but still on the shelf, so somebody has to
  // fetch it. Made on every save that leaves the box ticked rather than only
  // when it has just been ticked, because a disc already on the list keeps its
  // one open row.
  if (result.values.canBeSoldOrDonated) {
    const errandFailure = await requestDisposalErrand(supabase, externalId);

    if (errandFailure) {
      return data({ errors: { form: errandFailure }, ok: null }, { status: 500 });
    }
  }

  return data({ errors: null, ok: true }, { status: 200 });
}
