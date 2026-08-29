import { CONNECTION_ERROR, messageForStatus } from '~/features/api/errorMessages';

import type { DisposalMethodValue } from './disposalMethod';

/** The resource route that records the mark. */
const DISPOSAL_URL = '/discs/disposal';

const GENERIC_ERROR = 'Merkintä epäonnistui. Yritä uudelleen.';

export type DiscDisposalInput = {
  externalId: string;
  /** ISO date, y-MM-dd. */
  canBeSoldOrDonatedDate: string;
  /** Null when the method was left unanswered. */
  canBeSoldOrDonatedMethod: DisposalMethodValue | null;
};

export type DisposalResult = { status: 'success' } | { status: 'error'; message: string };

/**
 * Marks one disc as free to be sold or donated.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function markForDisposal(input: DiscDisposalInput): Promise<DisposalResult> {
  let response: Response;

  try {
    response = await fetch(DISPOSAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { status: 'error', message: CONNECTION_ERROR };
  }

  if (response.ok) {
    return { status: 'success' };
  }

  // The route answers with JSON on every path, so anything else means the
  // request never reached it — a signed-out redirect, or a proxy error page.
  let message: string | null = null;

  try {
    const body: unknown = await response.json();

    if (typeof (body as { error?: unknown })?.error === 'string') {
      message = (body as { error: string }).error;
    }
  } catch {
    message = null;
  }

  return { status: 'error', message: message ?? messageForStatus(response.status, GENERIC_ERROR) };
}
