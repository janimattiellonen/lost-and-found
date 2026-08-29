import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteDisc } from './deleteDisc';

const EXTERNAL_ID = '3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e';

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('deleteDisc', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the external id to the resource route', async () => {
    const fetchMock = stubFetch({});

    expect(await deleteDisc(EXTERNAL_ID)).toEqual({ status: 'success' });
    expect(fetchMock).toHaveBeenCalledWith('/discs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalId: EXTERNAL_ID }),
    });
  });

  it("passes the route's own message through", async () => {
    stubFetch({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Kiekkoa ei löytynyt. Se on ehkä jo poistettu.' }),
    });

    expect(await deleteDisc(EXTERNAL_ID)).toEqual({
      status: 'error',
      message: 'Kiekkoa ei löytynyt. Se on ehkä jo poistettu.',
    });
  });

  it('explains a 401 that came back as HTML rather than JSON', async () => {
    stubFetch({
      ok: false,
      status: 401,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    });

    expect(await deleteDisc(EXTERNAL_ID)).toMatchObject({ message: expect.stringContaining('Kirjautuminen') });
  });

  it('does not blame the session for some other non-JSON response', async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    });

    expect(await deleteDisc(EXTERNAL_ID)).toEqual({ status: 'error', message: 'Poisto epäonnistui. Yritä uudelleen.' });
  });

  it('turns a dropped connection into an error result rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await deleteDisc(EXTERNAL_ID)).toMatchObject({ status: 'error' });
  });
});
