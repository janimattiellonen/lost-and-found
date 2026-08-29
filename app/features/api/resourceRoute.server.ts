import type { MarkOutcome } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

/** Either the parsed request body, or the response to answer with instead. */
type Gate = { body: unknown } | { response: Response };

/**
 * The preamble every disc resource route shares: POST only, signed in, and a
 * JSON body it could actually read.
 *
 * Returns the body on the way through, or the refusal to return as-is.
 */
export async function requireAdminJson(request: Request): Promise<Gate> {
  if (request.method !== 'POST') {
    return { response: Response.json({ error: 'Virheellinen pyyntö.' }, { status: 405 }) };
  }

  if (!(await isUserLoggedIn(request))) {
    return {
      response: Response.json({ error: 'Kirjautuminen on vanhentunut. Kirjaudu uudelleen.' }, { status: 401 }),
    };
  }

  try {
    return { body: await request.json() };
  } catch {
    return { response: Response.json({ error: 'Virheellinen pyyntö.' }, { status: 400 }) };
  }
}

/**
 * Turns a mark that did not go through into the response for it, or null when
 * it did.
 *
 * 'not-permitted' means the row is there but the update changed nothing, which
 * is how a row-level security policy refuses an UPDATE.
 */
export function markRefusal(outcome: MarkOutcome): Response | null {
  if (outcome === 'not-found') {
    return Response.json({ error: 'Kiekkoa ei löytynyt.' }, { status: 404 });
  }

  if (outcome === 'not-permitted') {
    return Response.json(
      { error: 'Kiekko löytyi, mutta sen päivitys estyi. Tarkista tietokannan käyttöoikeudet (RLS).' },
      { status: 403 },
    );
  }

  return null;
}
