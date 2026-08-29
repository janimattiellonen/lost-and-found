import { CONNECTION_ERROR, messageForStatus } from '~/features/api/errorMessages';
import type { ParsedDisc } from '~/features/discParser/parseDiscText';

/** One disc as it will be sent to the server. */
export type DiscSubmission = {
  discName: string | null;
  plastic: string | null;
  colour: string | null;
  manufacturer: string | null;
  phoneNumber: string | null;
  ownerName: string | null;
};

export type SubmitResult = { status: 'success'; savedCount: number } | { status: 'error'; message: string };

/** Narrows a parsed row to the fields the server cares about. */
export function toSubmission(disc: ParsedDisc): DiscSubmission {
  return {
    discName: disc.discName,
    plastic: disc.plastic,
    colour: disc.colour,
    manufacturer: disc.manufacturer,
    phoneNumber: disc.phoneNumber,
    ownerName: disc.ownerName,
  };
}

/** The resource route that persists the batch. */
const SUBMIT_URL = '/discs/create';

const GENERIC_ERROR = 'Tallennus epäonnistui. Yritä uudelleen.';

const failed = (status: number) => messageForStatus(status, GENERIC_ERROR);

/**
 * Sends a batch of discs to be persisted.
 *
 * Never throws: a transport failure comes back as an error result, so callers
 * have one thing to handle rather than two.
 */
export async function submitDiscs(discs: DiscSubmission[]): Promise<SubmitResult> {
  if (discs.length === 0) {
    return { status: 'error', message: 'Ei tallennettavia kiekkoja.' };
  }

  let response: Response;

  try {
    response = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discs }),
    });
  } catch {
    return { status: 'error', message: CONNECTION_ERROR };
  }

  // The route answers with JSON on every path, so anything else means the
  // request never reached it — a signed-out redirect to the sign-in page, or a
  // proxy error page. The status decides what to say; do not guess at a cause.
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return { status: 'error', message: failed(response.status) };
  }

  const message = typeof (body as { error?: unknown })?.error === 'string' ? (body as { error: string }).error : null;

  if (!response.ok) {
    return { status: 'error', message: message ?? failed(response.status) };
  }

  const savedCount = (body as { savedCount?: unknown })?.savedCount;

  if (typeof savedCount !== 'number') {
    return { status: 'error', message: message ?? GENERIC_ERROR };
  }

  return { status: 'success', savedCount };
}
