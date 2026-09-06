import { createCookie } from 'react-router';

const RATE_LIMIT_MS = 2 * 60 * 1000;

/**
 * One sign-in link per browser per window, tracked in a cookie the way
 * `binFullRateLimit.server.ts` tracks bin-full reports.
 *
 * This stops an admin turning a double-clicked button into two live links; it
 * is not a defence, because anyone willing to clear a cookie or post from a
 * script gets past it. The limit that actually bounds how many mails one
 * address can receive is the per-hour cap configured in Supabase.
 */
export async function wasRecentlyRequested(request: Request): Promise<boolean> {
  const value = await cookie.parse(request.headers.get('Cookie'));
  const timestamp = typeof value === 'number' ? value : null;

  return timestamp != null && Date.now() - timestamp < RATE_LIMIT_MS;
}

/** Headers that start (or restart) the rate-limit window. */
export async function rateLimitHeaders(): Promise<Headers> {
  const headers = new Headers();
  headers.append('Set-Cookie', await cookie.serialize(Date.now()));

  return headers;
}

const cookie = createCookie('magic_link_rl', {
  path: '/sign-in',
  sameSite: 'lax',
  maxAge: RATE_LIMIT_MS / 1000,
  httpOnly: true,
});
