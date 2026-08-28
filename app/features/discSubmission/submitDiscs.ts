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

export type SubmitResult =
  | { status: 'success'; savedCount: number }
  | { status: 'error'; message: string };

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

/** How long the stub pretends to be talking to the server. */
const FAKE_LATENCY_MS = 700;

/**
 * Sends a batch of discs to be persisted.
 *
 * STUB: nothing leaves the browser yet. The real implementation will POST to a
 * React Router action, which will map each DiscSubmission onto DiscDTO, assign
 * the club and an internal disc id, and insert them. The signature and the
 * result shape are meant to survive that change, so only the body below is
 * replaced.
 *
 * Never throws: a transport failure comes back as an error result, so callers
 * have one thing to handle rather than two.
 */
export async function submitDiscs(discs: DiscSubmission[], options: { simulate?: string | null } = {}) {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));

  if (discs.length === 0) {
    return { status: 'error', message: 'Ei tallennettavia kiekkoja.' } satisfies SubmitResult;
  }

  // Prototype affordance: `/demo?simulate=error` exercises the error box, which
  // is otherwise unreachable while every save is assumed to succeed. Delete
  // this along with the stub.
  if (options.simulate === 'error') {
    return {
      status: 'error',
      message: 'Tallennus epäonnistui. Yhteys palvelimeen katkesi – yritä uudelleen.',
    } satisfies SubmitResult;
  }

  return { status: 'success', savedCount: discs.length } satisfies SubmitResult;
}
