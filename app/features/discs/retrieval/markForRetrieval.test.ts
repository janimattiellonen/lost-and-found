import { afterEach, describe, expect, it, vi } from 'vitest';

import { markForRetrieval } from './markForRetrieval';
import { RetrievalMethod } from './retrievalMethod';

const input = {
  externalId: '3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e',
  retrievalMethod: RetrievalMethod.PickedUp,
};

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('markForRetrieval', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the request to the resource route', async () => {
    const fetchMock = stubFetch({});

    expect(await markForRetrieval(input)).toEqual({ status: 'success' });
    expect(fetchMock).toHaveBeenCalledWith('/discs/retrieval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it("passes the route's own message through", async () => {
    stubFetch({ ok: false, status: 422, json: async () => ({ error: 'Virheellinen noutotapa.' }) });

    expect(await markForRetrieval(input)).toEqual({ status: 'error', message: 'Virheellinen noutotapa.' });
  });

  it('explains a 401 that came back as HTML rather than JSON', async () => {
    stubFetch({
      ok: false,
      status: 401,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    });

    expect(await markForRetrieval(input)).toMatchObject({ message: expect.stringContaining('Kirjautuminen') });
  });

  it('turns a dropped connection into an error result rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await markForRetrieval(input)).toMatchObject({ status: 'error' });
  });
});
