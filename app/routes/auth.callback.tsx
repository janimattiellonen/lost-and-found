import { redirect, type LoaderFunctionArgs } from 'react-router';

import { createSupabaseServerClientWithHeaders } from '~/models/utils';

/**
 * Where the link in the sign-in mail lands.
 *
 * The Supabase email template must point here with `token_hash` as an ordinary
 * query parameter -- the stock template returns the session in the URL fragment
 * instead, which the server never receives. See specs/11-auth-and-authorization.md.
 */

// Checked against the query string rather than passed straight to verifyOtp,
// which accepts any string.
const ALLOWED_TYPES = ['email', 'magiclink', 'recovery'] as const;

type OtpType = (typeof ALLOWED_TYPES)[number];

function toOtpType(value: string | null): OtpType | null {
  return ALLOWED_TYPES.find((allowed) => allowed === value) ?? null;
}

/**
 * Keeps the token out of the Referer header of anything the page leads to, and
 * out of search results. It is a live credential until it is used.
 */
function withLinkHeaders(headers: Headers): Headers {
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Robots-Tag', 'noindex, nofollow');

  return headers;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = toOtpType(url.searchParams.get('type'));

  // No `next` parameter is read: there is one place a signed-in admin needs to
  // land, and a destination taken from the query string is how this kind of
  // route becomes an open redirect.
  const failed = () => redirect('/sign-in?error=magic-link', { headers: withLinkHeaders(new Headers()) });

  if (!tokenHash || !type) {
    return failed();
  }

  // verifyOtp is what establishes the session, so its Set-Cookie headers have
  // to travel with the redirect -- a bare redirect('/') would consume the token
  // and sign nobody in.
  const { supabase, headers } = createSupabaseServerClientWithHeaders(request);

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    console.error(`Magic link verification failed: ${error.message}`);

    return failed();
  }

  return redirect('/', { headers: withLinkHeaders(headers) });
}
