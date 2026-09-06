import { describe, expect, it } from 'vitest';

import { replaceTokensWithValues, toSmsBody } from './messageContent';

const TOKEN = '8f14e45f-ceea-467a-9f7c-fd4b2a1e9a1c';

const disc = { discName: 'Destroyer', discColour: 'punainen', course: 'Oittaa', ownerLinkToken: TOKEN };

const BASE = 'https://loytokiekot.example.org';

describe('replaceTokensWithValues', () => {
  it('fills the disc in', () => {
    expect(replaceTokensWithValues('Löysimme [colour] [disc]-kiekkosi.', disc, BASE)).toBe(
      'Löysimme punainen Destroyer-kiekkosi.',
    );
  });

  it("fills in the owner's own link", () => {
    expect(replaceTokensWithValues('Kerro täällä: [link]', disc, BASE)).toBe(`Kerro täällä: ${BASE}/disc/${TOKEN}`);
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

  it('fills the course in as the disc records it', () => {
    expect(replaceTokensWithValues('Rata: [course]', disc, BASE)).toBe('Rata: Oittaa');
  });

  // The sentence this token exists for. The template supplies "radalta"; only
  // the inflected name comes from here.
  it.each([
    ['Oittaa', 'Oittaan'],
    ['Äijänpelto', 'Äijänpellon'],
  ])('puts %s in the genitive as %s', (stored, genitive) => {
    expect(replaceTokensWithValues('on löytynyt [courses] radalta.', { ...disc, course: stored }, BASE)).toBe(
      `on löytynyt ${genitive} radalta.`,
    );
  });

  // The tokens look like they should collide and do not: `[course]` never
  // matches inside `[courses]`, the closing bracket keeping them apart. Pinned
  // so a token that genuinely is a prefix of another fails here first.
  it('keeps the two course tokens apart in one message', () => {
    expect(replaceTokensWithValues('[courses] radalta, rata [course]', disc, BASE)).toBe(
      'Oittaan radalta, rata Oittaa',
    );
  });

  // Imported Sheet data can hold any course an admin once typed. An uninflected
  // name reads slightly wrong; losing the course reads worse.
  it.each(['[course]', '[courses]'])('keeps a course that matches no configured one in %s', (token) => {
    expect(replaceTokensWithValues(token, { ...disc, course: 'Jokin muu rata' }, BASE)).toBe('Jokin muu rata');
  });

  it.each([
    ['no colour', { ...disc, discColour: '' }, '[colour]'],
    ['no name', { ...disc, discName: '' }, '[disc]'],
    ['no course at all', { ...disc, course: null }, '[course]'],
    ['no course at all, genitive', { ...disc, course: null }, '[courses]'],
  ])('substitutes an empty value for %s rather than leaving the token in', (_reason, value, token) => {
    expect(replaceTokensWithValues(`x${token}y`, value, BASE)).toBe('xy');
  });

  it('leaves a message with no tokens alone', () => {
    expect(replaceTokensWithValues('Moi!', disc, BASE)).toBe('Moi!');
  });
});

describe('toSmsBody', () => {
  // The bug this function exists for; see spec 06 for the whole story.
  it('escapes a question mark, so the message does not stop there', () => {
    const body = toSmsBody('Moikka. Milloin pääsisit noutamaan kiekon?\nLintukorpi 13 C 11');

    expect(body).not.toContain('?');
    expect(decodeURIComponent(body)).toBe('Moikka. Milloin pääsisit noutamaan kiekon?\nLintukorpi 13 C 11');
  });

  it('escapes the other characters that would split a url', () => {
    expect(toSmsBody('a?b&c#d+e')).toBe('a%3Fb%26c%23d%2Be');
  });

  // The hand-rolled version wrote the lowercase %0a. Percent-decoding is
  // case-insensitive, so the handset reads both as a newline -- but the url
  // this produces is not the one it produced.
  it('writes a newline as %0A', () => {
    expect(toSmsBody('one\ntwo')).toBe('one%0Atwo');
  });

  // Scandinavian letters are in every one of these messages.
  it('survives a round trip through the scandinavian alphabet', () => {
    expect(decodeURIComponent(toSmsBody('Äijänpellon radalta, Öö'))).toBe('Äijänpellon radalta, Öö');
  });
});
