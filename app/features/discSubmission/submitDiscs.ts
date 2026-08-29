import { postJson } from '~/features/api/postJson';
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

  const result = await postJson(SUBMIT_URL, { discs }, GENERIC_ERROR);

  if (result.status === 'error') {
    return result;
  }

  const body = result.body as { savedCount?: unknown; error?: unknown } | null;
  const savedCount = body?.savedCount;

  // A success the route did not count is not one we can report.
  if (typeof savedCount !== 'number') {
    return { status: 'error', message: typeof body?.error === 'string' ? body.error : GENERIC_ERROR };
  }

  return { status: 'success', savedCount };
}
