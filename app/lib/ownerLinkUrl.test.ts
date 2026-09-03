import { describe, expect, it } from 'vitest';

import { ownerLinkUrl } from './ownerLinkUrl';

const TOKEN = '8f14e45f-ceea-467a-9f7c-fd4b2a1e9a1c';

describe('ownerLinkUrl', () => {
  it('builds the link an owner receives', () => {
    expect(ownerLinkUrl('https://loytokiekot.example.org', TOKEN)).toBe(
      `https://loytokiekot.example.org/kiekko/${TOKEN}`,
    );
  });

  it('does not double the slash when the base url has one', () => {
    expect(ownerLinkUrl('https://loytokiekot.example.org/', TOKEN)).toBe(
      `https://loytokiekot.example.org/kiekko/${TOKEN}`,
    );
  });

  // A disc with no token cannot be linked to. Empty rather than a url ending in
  // "undefined", which would be sent to an owner as a working-looking link.
  it.each([undefined, ''])('gives nothing back for a disc with no token (%s)', (token) => {
    expect(ownerLinkUrl('https://loytokiekot.example.org', token)).toBe('');
  });
});
