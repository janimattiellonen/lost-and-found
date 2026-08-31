import { afterEach, describe, expect, it, vi } from 'vitest';

import { setDiscCourse } from './setDiscCourse';

const input = { externalId: '3f8a1c2e-5b6d-4a7f-9c0e-1d2b3a4c5d6e', course: 'Oittaa' };

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('setDiscCourse', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the course to the resource route', async () => {
    const fetchMock = stubFetch({});

    expect(await setDiscCourse(input)).toEqual({ status: 'success' });
    expect(fetchMock).toHaveBeenCalledWith('/discs/course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it('sends a cleared course as null', async () => {
    const fetchMock = stubFetch({});

    await setDiscCourse({ ...input, course: null });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ course: null });
  });

  it("passes the route's own message through", async () => {
    stubFetch({ ok: false, status: 422, json: async () => ({ error: 'Tuntematon rata "Tali".' }) });

    expect(await setDiscCourse(input)).toEqual({ status: 'error', message: 'Tuntematon rata "Tali".' });
  });

  it('reports a transport failure rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    expect(await setDiscCourse(input)).toMatchObject({ status: 'error' });
  });
});
