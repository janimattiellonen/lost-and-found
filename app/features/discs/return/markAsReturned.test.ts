import { afterEach, describe, expect, it, vi } from 'vitest';

import { markAsReturned } from './markAsReturned';
import { ReturnMethod } from './returnMethod';

const input = {
  externalId: '3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e',
  returnedToOwnerDate: '2026-08-29',
  returnMethod: ReturnMethod.ByMail,
};

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('markAsReturned', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the return to the resource route', async () => {
    const fetchMock = stubFetch({});

    expect(await markAsReturned(input)).toEqual({ status: 'success' });
    expect(fetchMock).toHaveBeenCalledWith('/discs/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it('sends a cleared method as null', async () => {
    const fetchMock = stubFetch({});

    await markAsReturned({ ...input, returnMethod: null });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ returnMethod: null });
  });

  it("passes the route's own message through", async () => {
    stubFetch({ ok: false, status: 422, json: async () => ({ error: 'Virheellinen palautuspäivä.' }) });

    expect(await markAsReturned(input)).toEqual({ status: 'error', message: 'Virheellinen palautuspäivä.' });
  });

  it('explains a 401 that came back as HTML rather than JSON', async () => {
    stubFetch({
      ok: false,
      status: 401,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    });

    expect(await markAsReturned(input)).toMatchObject({ message: expect.stringContaining('Kirjautuminen') });
  });

  it('turns a dropped connection into an error result rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await markAsReturned(input)).toMatchObject({ status: 'error' });
  });
});
