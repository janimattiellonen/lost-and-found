import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAGIC_LINK_NOTICE, requestMagicLink } from './requestMagicLink.server';

const signInWithOtp = vi.fn();

vi.mock('~/models/utils', () => ({
  createSupabaseServerClient: () => ({ auth: { signInWithOtp } }),
}));

function post(email: string, cookie?: string): Request {
  return new Request('https://loytokiekot.example.org/sign-in', {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : undefined,
  });
}

// `data()` wraps the payload; unwrap what the browser would actually receive.
function noticeOf(result: Awaited<ReturnType<typeof requestMagicLink>>): string {
  return (result.data as { notice: string }).notice;
}

function setCookieOf(result: Awaited<ReturnType<typeof requestMagicLink>>): string | null {
  return new Headers(result.init?.headers).get('Set-Cookie');
}

describe('requestMagicLink', () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    signInWithOtp.mockResolvedValue({ error: null });
  });

  it('asks Supabase to mail a link back to the origin the request came from', async () => {
    await requestMagicLink(post('admin@example.org'), 'admin@example.org');

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'admin@example.org',
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'https://loytokiekot.example.org/auth/callback',
      },
    });
  });

  it('never lets a posted address create an account', async () => {
    await requestMagicLink(post('stranger@example.org'), 'stranger@example.org');

    expect(signInWithOtp.mock.calls[0][0].options.shouldCreateUser).toBe(false);
  });

  it('trims and lowercases the address before asking', async () => {
    await requestMagicLink(post('  Admin@Example.ORG '), '  Admin@Example.ORG ');

    expect(signInWithOtp.mock.calls[0][0].email).toBe('admin@example.org');
  });

  // The point of the feature's neutral reply: an unknown address makes Supabase
  // answer "Signups not allowed for otp", and none of that may reach the page.
  it('gives the same notice whether or not the account exists', async () => {
    const known = await requestMagicLink(post('admin@example.org'), 'admin@example.org');

    signInWithOtp.mockResolvedValue({ error: { message: 'Signups not allowed for otp' } });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const unknown = await requestMagicLink(post('stranger@example.org'), 'stranger@example.org');

    expect(noticeOf(known)).toBe(MAGIC_LINK_NOTICE);
    expect(noticeOf(unknown)).toBe(MAGIC_LINK_NOTICE);
    expect(JSON.stringify(unknown.data)).not.toContain('Signups not allowed');
  });

  it('gives the same notice for a malformed address, without asking Supabase', async () => {
    const result = await requestMagicLink(post('not-an-address'), 'not-an-address');

    expect(noticeOf(result)).toBe(MAGIC_LINK_NOTICE);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('gives the same notice when no address was posted at all', async () => {
    const result = await requestMagicLink(post(''), null);

    expect(noticeOf(result)).toBe(MAGIC_LINK_NOTICE);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('sends no second mail while the rate-limit cookie is fresh', async () => {
    const first = await requestMagicLink(post('admin@example.org'), 'admin@example.org');
    const cookie = setCookieOf(first);

    expect(cookie).not.toBeNull();

    const second = await requestMagicLink(post('admin@example.org', cookie!.split(';')[0]), 'admin@example.org');

    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    expect(noticeOf(second)).toBe(MAGIC_LINK_NOTICE);
  });
});
