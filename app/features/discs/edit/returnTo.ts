/** The query parameter the edit page reads its way back from. */
export const RETURN_TO_PARAM = 'returnTo';

/** Where "Peru" leads when nothing, or nothing safe, says otherwise: the disc list. */
const DEFAULT_RETURN_TO = '/';

/**
 * The edit page of one disc, with the page its "Peru" should come back to when
 * that is not the disc list. Built here, beside the check that reads the value
 * back, so the two ends of the parameter cannot drift apart.
 */
export function editDiscPath(externalId: string, returnTo?: string): string {
  const path = `/discs/${externalId}/edit`;

  return returnTo ? `${path}?${new URLSearchParams({ [RETURN_TO_PARAM]: returnTo }).toString()}` : path;
}

/**
 * A stand-in origin to resolve the value against. Nothing is ever fetched from
 * it: if the value resolves anywhere else, it named another site.
 */
const THIS_APP = 'http://this-app.invalid';

/**
 * The page the edit form's "Peru" (cancel) leads back to, from the `returnTo`
 * query parameter — or the disc list when it is missing or unsafe.
 *
 * Only a path inside this app is accepted, or a crafted link to the edit page
 * would turn "Peru" into a jump to anywhere. A prefix check is not enough on
 * its own: browsers read `//host` and `/\host` as another site, and strip tabs
 * and line breaks first, so "/<tab>/host" is one too. The value is therefore
 * resolved the way a browser would, and kept only if it stays on this app.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value?.startsWith('/')) {
    return DEFAULT_RETURN_TO;
  }

  let resolved: URL;

  try {
    resolved = new URL(value, THIS_APP);
  } catch {
    return DEFAULT_RETURN_TO;
  }

  if (resolved.origin !== THIS_APP) {
    return DEFAULT_RETURN_TO;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
