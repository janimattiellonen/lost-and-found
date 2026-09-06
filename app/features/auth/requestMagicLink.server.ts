import { data } from 'react-router';

import { createSupabaseServerClient } from '~/models/utils';

import { rateLimitHeaders, wasRecentlyRequested } from './magicLinkRateLimit.server';

/**
 * The only thing `/sign-in` ever says back to a link request.
 *
 * It is returned for a registered address, an unregistered one, a malformed one
 * and a failed send alike. Anything more specific would tell whoever posted the
 * form which addresses are club admins.
 */
export const MAGIC_LINK_NOTICE = 'Jos sähköpostiosoite on rekisteröity, lähetimme siihen kirjautumislinkin.';

export type MagicLinkNotice = { notice: string };

/**
 * Asks Supabase to mail a one-time sign-in link.
 *
 * Supabase mints, sends and expires the token; this app keeps no record of it.
 * The link in the mail comes back to `/auth/callback` on the origin this
 * request arrived at, so the same Supabase email template serves localhost,
 * preview deployments and production.
 */
export async function requestMagicLink(request: Request, rawEmail: FormDataEntryValue | null) {
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (email.length === 0 || !email.includes('@')) {
    return data<MagicLinkNotice>({ notice: MAGIC_LINK_NOTICE });
  }

  if (await wasRecentlyRequested(request)) {
    return data<MagicLinkNotice>({ notice: MAGIC_LINK_NOTICE });
  }

  const supabase = createSupabaseServerClient(request);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Without this, posting an unknown address to a public form would create
      // an auth.users row -- and every RLS policy here grants writes to the
      // `authenticated` role as a whole, so that account would be a full admin.
      shouldCreateUser: false,
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  });

  if (error) {
    // Logged, never returned: for an address with no account this reads
    // "Signups not allowed for otp", which would answer the question the
    // neutral notice exists to avoid answering.
    console.error(`Magic link request failed: ${error.message}`);
  }

  return data<MagicLinkNotice>({ notice: MAGIC_LINK_NOTICE }, { headers: await rateLimitHeaders() });
}
