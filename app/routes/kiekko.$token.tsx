import { redirect, type LoaderFunctionArgs } from 'react-router';

import { OWNER_LINK_PATH } from '~/lib/ownerLinkUrl';

/**
 * The owner link's old Finnish path, kept alive for ever.
 *
 * Routes are named in English; Finnish is for what the user reads. This one had
 * already gone out inside text messages that cannot be recalled, and an owner
 * may open one months from now, so the path redirects rather than disappearing.
 * See specs/05-owner-link-and-responses.md.
 */
export function loader({ params }: LoaderFunctionArgs) {
  return redirect(`${OWNER_LINK_PATH}/${params.token ?? ''}`, {
    // Permanent: the old path will never serve a page again.
    status: 301,
    // Repeated from the page itself. The token rides in the Location header, and
    // two headers cost nothing next to reasoning about how a crawler treats a hop.
    headers: {
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
