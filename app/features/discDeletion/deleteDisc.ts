import { CONNECTION_ERROR, messageForStatus } from '~/features/api/errorMessages';

/** The resource route that performs the delete. */
const DELETE_URL = '/discs/delete';

const GENERIC_ERROR = 'Poisto epäonnistui. Yritä uudelleen.';

export type DeleteResult = { status: 'success' } | { status: 'error'; message: string };

/**
 * Deletes one disc by its external id.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function deleteDisc(externalId: string): Promise<DeleteResult> {
  let response: Response;

  try {
    response = await fetch(DELETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalId }),
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
