import { describe, expect, it } from 'vitest';

import { parseDiscText } from './parseDiscText';

/** Only the fields a given case cares about, so assertions stay readable. */
function fields(input: string) {
  const { discName, plastic, manufacturer, colour, ownerName, phoneNumber } = parseDiscText(input);

  return { discName, plastic, manufacturer, colour, ownerName, phoneNumber };
}

describe('parseDiscText — the examples from the brief', () => {
  it('parses "Star Destroyer punainen 050 123 4567 Steve D."', () => {
    expect(fields('Star Destroyer punainen 050 123 4567 Steve D.')).toEqual({
      discName: 'Destroyer',
      plastic: 'Star',
      manufacturer: 'Innova',
      colour: 'Punainen',
      ownerName: 'Steve D.',
      phoneNumber: '0501234567',
    });
  });

  it('parses "Mako3 keltainen"', () => {
    expect(fields('Mako3 keltainen')).toEqual({
      discName: 'Mako3',
      plastic: null,
      manufacturer: 'Innova',
      colour: 'Keltainen',
      ownerName: null,
      phoneNumber: null,
    });
  });

  it('parses "S-Line DD3 pinkki Peter D."', () => {
    expect(fields('S-Line DD3 pinkki Peter D.')).toEqual({
      discName: 'DD3',
      plastic: 'S-Line',
      manufacturer: 'Discmania',
      colour: 'Pinkki',
      ownerName: 'Peter D.',
      phoneNumber: null,
    });
  });

  it('parses "Opto Ballista punainen Pekka P."', () => {
    expect(fields('Opto Ballista punainen Pekka P.')).toEqual({
      discName: 'Ballista',
      plastic: 'Opto',
      manufacturer: 'Latitude 64°',
      colour: 'Punainen',
      ownerName: 'Pekka P.',
      phoneNumber: null,
    });
  });

  it('parses "Gold Stiletto kellertävä, Liisa"', () => {
    expect(fields('Gold Stiletto kellertävä, Liisa')).toEqual({
      discName: 'Stiletto',
      plastic: 'Gold',
      manufacturer: 'Latitude 64°',
      colour: 'Kellertävä',
      ownerName: 'Liisa',
      phoneNumber: null,
    });
  });

  it('parses "VIP King ruskea 050 111 9876"', () => {
    expect(fields('VIP King ruskea 050 111 9876')).toEqual({
      discName: 'King',
      plastic: 'VIP',
      manufacturer: 'Westside Discs',
      colour: 'Ruskea',
      ownerName: null,
      phoneNumber: '0501119876',
    });
  });
});

describe('parseDiscText — plain colours', () => {
  it.each([
    ['musta', 'Musta'],
    ['ruskea', 'Ruskea'],
  ])('recognises "%s"', (written, expected) => {
    expect(parseDiscText(`Mako3 ${written}`).colour).toBe(expected);
  });
});

describe('parseDiscText — phone numbers', () => {
  it.each([
    ['050 123 4567', '0501234567'],
    ['0501112345', '0501112345'],
    ['+372 444 3333', '+3724443333'],
    ['+372504442222', '+372504442222'],
    ['040-123 4567', '0401234567'],
  ])('extracts %s', (written, expected) => {
    expect(parseDiscText(`Mako3 keltainen ${written}`).phoneNumber).toBe(expected);
  });

  it('does not mistake a disc name containing a digit for a phone number', () => {
    expect(parseDiscText('Mako3 keltainen').phoneNumber).toBeNull();
  });

  it('does not treat a short number as a phone number', () => {
    expect(parseDiscText('Mako3 keltainen 175').phoneNumber).toBeNull();
  });
});

describe('parseDiscText — omissions', () => {
  it('handles a missing plastic', () => {
    expect(fields('Destroyer punainen')).toMatchObject({ discName: 'Destroyer', plastic: null });
  });

  it('handles a missing disc name', () => {
    expect(fields('Star punainen')).toMatchObject({ discName: null, plastic: 'Star', manufacturer: 'Innova' });
  });

  it('handles a missing owner name and phone number', () => {
    expect(fields('Star Destroyer punainen')).toMatchObject({ ownerName: null, phoneNumber: null });
  });

  it('handles input with nothing recognisable at all', () => {
    expect(fields('jotain aivan muuta')).toMatchObject({
      discName: null,
      plastic: null,
      manufacturer: null,
      colour: null,
    });
  });

  it('never throws on empty input', () => {
    expect(fields('')).toEqual({
      discName: null,
      plastic: null,
      manufacturer: null,
      colour: null,
      ownerName: null,
      phoneNumber: null,
    });
  });
});

describe('parseDiscText — multi-word entries win over their prefixes', () => {
  it('prefers the multi-word plastic "Active Premium" over the bare word', () => {
    expect(fields('Active Premium FD punainen')).toMatchObject({
      plastic: 'Active Premium',
      discName: 'FD',
      manufacturer: 'Discmania',
    });
  });

  it('prefers the multi-word colour "Vaalean sininen"', () => {
    expect(fields('Mako3 vaalean sininen')).toMatchObject({ colour: 'Vaalean sininen' });
  });

  it('matches a multi-word colour written with its comma', () => {
    expect(fields('Mako3 keltainen, musta halo')).toMatchObject({ colour: 'Keltainen, musta halo' });
  });
});

describe('parseDiscText — manufacturer inference', () => {
  it('infers the manufacturer from the plastic alone', () => {
    expect(parseDiscText('C-Line punainen').manufacturer).toBe('Discmania');
  });

  it('infers the manufacturer from the disc name alone', () => {
    expect(parseDiscText('Undertaker punainen').manufacturer).toBe('Discraft');
  });

  it('uses the disc name and plastic agreeing as the strongest signal', () => {
    const result = parseDiscText('Titanium Undertaker punainen');

    expect(result.manufacturer).toBe('Discraft');
    expect(result.confidence.manufacturer).toBe('high');
  });

  it('reports low confidence when only one weak signal is present', () => {
    expect(parseDiscText('Wave punainen').confidence.manufacturer).toBe('low');
  });
});

describe('parseDiscText — an explicitly typed manufacturer', () => {
  it('is recognised rather than mistaken for the owner', () => {
    expect(fields('Innova Destroyer punainen')).toMatchObject({
      discName: 'Destroyer',
      manufacturer: 'Innova',
      ownerName: null,
    });
  });

  it('is recognised when written after the disc name', () => {
    expect(fields('Berg Kastaplast sininen')).toMatchObject({
      discName: 'Berg',
      manufacturer: 'Kastaplast',
      ownerName: null,
    });
  });

  it('is trusted over the disc name it disagrees with', () => {
    const result = parseDiscText('Innova Berg sininen');

    expect(result.manufacturer).toBe('Innova');
    expect(result.confidence.manufacturer).toBe('high');
  });

  it('still leaves a real owner name in place', () => {
    expect(fields('Innova Destroyer punainen Steve D.')).toMatchObject({
      manufacturer: 'Innova',
      ownerName: 'Steve D.',
    });
  });
});

describe('parseDiscText — ambiguity between disc names and plastics', () => {
  it('reads "Eclipse Wave" as a plastic followed by a disc name', () => {
    expect(fields('Eclipse Wave punainen')).toMatchObject({ plastic: 'Eclipse', discName: 'Wave' });
  });

  it('treats a lone collision word as a disc name', () => {
    expect(fields('Meteor punainen')).toMatchObject({ discName: 'Meteor' });
  });
});

describe('parseDiscText — leftovers', () => {
  it('reports tokens it could not place', () => {
    expect(parseDiscText('Mako3 kaljakori').unmatched).toEqual(['kaljakori']);
  });

  it('is not confused by extra whitespace', () => {
    expect(fields('  Star   Destroyer    punainen ')).toMatchObject({
      plastic: 'Star',
      discName: 'Destroyer',
      colour: 'Punainen',
    });
  });
});
