import { describe, expect, it } from 'vitest';

import { replaceTokensWithValues } from './messageContent';

const TOKEN = '8f14e45f-ceea-467a-9f7c-fd4b2a1e9a1c';

const disc = { discName: 'Destroyer', discColour: 'punainen', ownerLinkToken: TOKEN };

const BASE = 'https://loytokiekot.example.org';

describe('replaceTokensWithValues', () => {
  it('fills the disc in', () => {
    expect(replaceTokensWithValues('Löysimme [colour] [disc]-kiekkosi.', disc, BASE)).toBe(
      'Löysimme punainen Destroyer-kiekkosi.',
    );
  });

  it("fills in the owner's own link", () => {
    expect(replaceTokensWithValues('Kerro täällä: [link]', disc, BASE)).toBe(`Kerro täällä: ${BASE}/kiekko/${TOKEN}`);
  });

  // Used to substitute the first one and send the second as a literal "[disc]".
  it('fills in every occurrence of a token, not just the first', () => {
    expect(replaceTokensWithValues('[disc] – [disc]', disc, BASE)).toBe('Destroyer – Destroyer');
  });

  // Rather than a link ending in "undefined", which would look like it works.
  it('leaves nothing behind for a disc with no token', () => {
    expect(replaceTokensWithValues('Kerro täällä: [link]', { ...disc, ownerLinkToken: undefined }, BASE)).toBe(
      'Kerro täällä: ',
    );
  });

  it.each([
    ['no colour', { ...disc, discColour: '' }, '[colour]'],
    ['no name', { ...disc, discName: '' }, '[disc]'],
  ])('substitutes an empty value for %s rather than leaving the token in', (_reason, value, token) => {
    expect(replaceTokensWithValues(`x${token}y`, value, BASE)).toBe('xy');
  });

  it('leaves a message with no tokens alone', () => {
    expect(replaceTokensWithValues('Moi!', disc, BASE)).toBe('Moi!');
  });
});
