import { CONNECTION_ERROR, messageForStatus } from '~/features/api/errorMessages';

import type { ReturnMethodValue } from './returnMethod';

/** The resource route that records the return. */
const RETURN_URL = '/discs/return';

const GENERIC_ERROR = 'Merkintä epäonnistui. Yritä uudelleen.';

export type DiscReturnInput = {
  externalId: string;
  /** ISO date, y-MM-dd. */
  returnedToOwnerDate: string;
  /** Null when the method was left unanswered. */
  returnMethod: ReturnMethodValue | null;
};

export type ReturnResult = { status: 'success' } | { status: 'error'; message: string };

/**
 * Marks one disc as returned to its owner.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function markAsReturned(input: DiscReturnInput): Promise<ReturnResult> {
  let response: Response;

  try {
    response = await fetch(RETURN_URL, {
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
