import { createCookie } from 'react-router';

const RATE_LIMIT_MS = 10 * 60 * 1000;

/**
 * One "bin is full" report per course per rate-limit window, tracked in a
 * per-course cookie so a passer-by cannot spam the club with the same report.
 */
export async function wasRecentlySubmitted(request: Request, slug: string): Promise<boolean> {
  const value = await cookieFor(slug).parse(request.headers.get('Cookie'));
  const timestamp = typeof value === 'number' ? value : null;

  return timestamp != null && Date.now() - timestamp < RATE_LIMIT_MS;
}

/** Headers that start (or restart) the rate-limit window for one course. */
export async function rateLimitHeaders(slug: string): Promise<Headers> {
  const headers = new Headers();
  headers.append('Set-Cookie', await cookieFor(slug).serialize(Date.now()));

  return headers;
}

const cookieFor = (slug: string) =>
  createCookie(`bin_full_rl_${slug}`, {
    path: '/bin/full',
    sameSite: 'lax',
    maxAge: RATE_LIMIT_MS / 1000,
    httpOnly: true,
  });
