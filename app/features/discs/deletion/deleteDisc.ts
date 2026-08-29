import { type ActionResult, postJson } from '~/lib/api/postJson';

/** The resource route that performs the delete. */
const DELETE_URL = '/discs/delete';

const GENERIC_ERROR = 'Poisto epäonnistui. Yritä uudelleen.';

/**
 * Deletes one disc by its external id.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function deleteDisc(externalId: string): Promise<ActionResult> {
  const result = await postJson(DELETE_URL, { externalId }, GENERIC_ERROR);

  return result.status === 'success' ? { status: 'success' } : result;
}
