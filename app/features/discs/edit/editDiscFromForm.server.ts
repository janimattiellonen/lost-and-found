import { data, redirect } from 'react-router';

import { currentClubId } from '~/config/clubs';
import { getDiscCourseNames } from '~/config/courses';
import { validateDiscEdit, type DiscEditErrors } from '~/features/discs/edit/discEdit';
import { queryUpdateDisc } from '~/features/discs/edit/queryUpdateDisc.server';
import { queryRequestDisposalRetrievals } from '~/features/discs/retrieval/queryRequestDisposalRetrievals.server';
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

  const result = validateDiscEdit(form, getDiscCourseNames(clubId));

  if (result.errors) {
    return data({ errors: result.errors, ok: null }, { status: 422 });
  }

  let outcome;

  try {
    outcome = await queryUpdateDisc(createSupabaseServerClient(request), {
      externalId,
      clubId,
      values: result.values,
    });
  } catch (error) {
    const errors: DiscEditErrors = {
      form: error instanceof Error ? error.message : 'Kiekon tallennus epäonnistui.',
    };

    return data({ errors, ok: null }, { status: 500 });
  }

  if (outcome === 'not-found') {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  // The same second write the list's disposal action makes: a released disc is
  // off the public list but still on the shelf, so somebody has to fetch it.
  // Made unconditionally rather than only when the box has just been ticked,
  // because a disc already on the list keeps its one open row — so this needs
  // no read of what the disc looked like before.
  if (result.values.canBeSoldOrDonated) {
    try {
      await queryRequestDisposalRetrievals(createSupabaseServerClient(request), [externalId]);
    } catch (error) {
      // The disc is saved and only the errand is missing, which is what the
      // message says: telling the admin the save failed would send him back to
      // redo a save that already happened.
      const errors: DiscEditErrors = {
        form: error instanceof Error ? error.message : 'Noutolistalle lisääminen epäonnistui.',
      };

      return data({ errors, ok: null }, { status: 500 });
    }
  }

  return data({ errors: null, ok: true }, { status: 200 });
}
