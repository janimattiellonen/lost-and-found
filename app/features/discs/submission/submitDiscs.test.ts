import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseDiscText } from '~/features/discs/submission/parser/parseDiscText';

import { submitDiscs, toSubmission } from './submitDiscs';

describe('toSubmission', () => {
  it('keeps the fields the server needs and drops the rest', () => {
    const parsed = parseDiscText('Star Destroyer punainen 050 123 4567 Steve D.');

    expect(toSubmission(parsed)).toEqual({
      discName: 'Destroyer',
      plastic: 'Star',
      colour: 'Punainen',
      manufacturer: 'Innova',
      phoneNumber: '0501234567',
      ownerName: 'Steve D.',
    });
  });

  it('passes unidentified fields through as null', () => {
    expect(toSubmission(parseDiscText('Mako3 keltainen'))).toMatchObject({
      plastic: null,
      phoneNumber: null,
      ownerName: null,
    });
  });
});

describe('submitDiscs', () => {
  const disc = toSubmission(parseDiscText('Mako3 keltainen'));

  function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, ...response });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the batch as JSON to the resource route', async () => {
    const fetchMock = stubFetch({ json: async () => ({ savedCount: 1 }) });

    await submitDiscs([disc]);

    expect(fetchMock).toHaveBeenCalledWith('/discs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discs: [disc] }),
    });
  });

  it('reports how many discs were saved', async () => {
    stubFetch({ json: async () => ({ savedCount: 2 }) });

    expect(await submitDiscs([disc, disc])).toEqual({ status: 'success', savedCount: 2 });
  });

  it('refuses an empty batch without going to the server', async () => {
    const fetchMock = stubFetch({ json: async () => ({ savedCount: 0 }) });

    expect(await submitDiscs([])).toMatchObject({ status: 'error' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the server's own message through", async () => {
    stubFetch({ ok: false, json: async () => ({ error: 'Rivi 1: kiekolla on oltava nimi tai muovi.' }) });

    expect(await submitDiscs([disc])).toEqual({
      status: 'error',
      message: 'Rivi 1: kiekolla on oltava nimi tai muovi.',
    });
  });

  it('turns a dropped connection into an error result rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await submitDiscs([disc])).toMatchObject({ status: 'error' });
  });

  it('explains a 401 that came back as HTML rather than JSON', async () => {
    stubFetch({
      ok: false,
      status: 401,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    });

    expect(await submitDiscs([disc])).toMatchObject({ message: expect.stringContaining('Kirjautuminen') });
  });

  it('does not blame the session for some other non-JSON response', async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    });

    expect(await submitDiscs([disc])).toEqual({ status: 'error', message: 'Tallennus epäonnistui. Yritä uudelleen.' });
  });

  it("reports the route's own 401 message", async () => {
    stubFetch({ ok: false, status: 401, json: async () => ({ error: 'Kirjautuminen on vanhentunut.' }) });

    expect(await submitDiscs([disc])).toEqual({ status: 'error', message: 'Kirjautuminen on vanhentunut.' });
  });

  it('treats a success without a count as a failure', async () => {
    stubFetch({ json: async () => ({}) });

    expect(await submitDiscs([disc])).toMatchObject({ status: 'error' });
  });
});
