import { describe, expect, it } from 'vitest';

import { ADDRESS_LIMITS, parseOwnerResponse } from './parseOwnerResponse';
import { HandoverMethod } from '~/features/discs/handoverMethod';
import { OwnerChoice } from './ownerChoice';

const AT_HOME = [HandoverMethod.ByMail, HandoverMethod.PickedUpFromHome];
const IN_STORAGE = [...AT_HOME, HandoverMethod.PickedUpFromStorage];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.set(name, value));

  return data;
}

const address = {
  shippingName: 'Matti Meikäläinen',
  shippingStreet: 'Kiekkokuja 4 B 12',
  shippingPostalCode: '00100',
  shippingCity: 'Helsinki',
};

describe('parseOwnerResponse', () => {
  it('reads an owner giving the disc to the club', () => {
    expect(parseOwnerResponse(form({ choice: '0' }), AT_HOME)).toEqual({ response: { choice: OwnerChoice.GivesUp } });
  });

  // Giving the disc up names no method, and the CHECK constraint agrees.
  it('ignores a method sent alongside giving the disc up', () => {
    expect(parseOwnerResponse(form({ choice: '0', handoverMethod: '1' }), AT_HOME)).toEqual({
      response: { choice: OwnerChoice.GivesUp },
    });
  });

  it('reads a collection, which needs no address', () => {
    expect(parseOwnerResponse(form({ choice: '1', handoverMethod: '1' }), AT_HOME)).toEqual({
      response: { choice: OwnerChoice.WantsItBack, handoverMethod: HandoverMethod.PickedUpFromHome },
    });
  });

  it('reads a posting with its address', () => {
    expect(parseOwnerResponse(form({ choice: '1', handoverMethod: '0', ...address }), AT_HOME)).toEqual({
      response: {
        choice: OwnerChoice.WantsItBack,
        handoverMethod: HandoverMethod.ByMail,
        address: {
          name: 'Matti Meikäläinen',
          street: 'Kiekkokuja 4 B 12',
          postalCode: '00100',
          city: 'Helsinki',
          country: '',
        },
      },
    });
  });

  describe('an owner with several discs waiting', () => {
    it('reads a posting that asks for no address', () => {
      expect(parseOwnerResponse(form({ choice: '1', handoverMethod: '0', hasMoreDiscs: 'on' }), AT_HOME)).toEqual({
        response: { choice: OwnerChoice.WantsItBack, handoverMethod: HandoverMethod.ByMail, hasMoreDiscs: true },
      });
    });

    // The page unmounts the address fields with the checkbox, but a stale form
    // could still carry them. The parcel's contents are being agreed by
    // message, so an address typed before the box was ticked means nothing.
    it('drops an address sent alongside it', () => {
      const parsed = parseOwnerResponse(
        form({ choice: '1', handoverMethod: '0', hasMoreDiscs: 'on', ...address }),
        AT_HOME,
      );

      expect(parsed).toEqual({
        response: { choice: OwnerChoice.WantsItBack, handoverMethod: HandoverMethod.ByMail, hasMoreDiscs: true },
      });
    });

    // An unticked checkbox is absent from the form data entirely.
    it('is off when the box is not ticked', () => {
      const parsed = parseOwnerResponse(form({ choice: '1', handoverMethod: '0', ...address }), AT_HOME);

      expect(parsed).not.toHaveProperty('response.hasMoreDiscs');
    });

    it('does not apply to a collection', () => {
      expect(parseOwnerResponse(form({ choice: '1', handoverMethod: '1', hasMoreDiscs: 'on' }), AT_HOME)).toEqual({
        response: { choice: OwnerChoice.WantsItBack, handoverMethod: HandoverMethod.PickedUpFromHome },
      });
    });
  });

  // The link may have been forwarded to anyone, and the columns behind these
  // fields are unbounded text.
  describe('the length of an address line', () => {
    it('refuses a line over its limit, naming it', () => {
      const parsed = parseOwnerResponse(
        form({ choice: '1', handoverMethod: '0', ...address, shippingStreet: 'x'.repeat(151) }),
        AT_HOME,
      );

      expect(parsed).toEqual({ error: 'Katuosoite on liian pitkä – enintään 150 merkkiä.' });
    });

    it('accepts a line exactly at its limit', () => {
      const street = 'x'.repeat(ADDRESS_LIMITS.shippingStreet.max);

      expect(
        parseOwnerResponse(form({ choice: '1', handoverMethod: '0', ...address, shippingStreet: street }), AT_HOME),
      ).toMatchObject({ response: { address: { street } } });
    });

    // Optional, so it is not covered by the required-fields check above.
    it('checks the country too', () => {
      const parsed = parseOwnerResponse(
        form({ choice: '1', handoverMethod: '0', ...address, shippingCountry: 'x'.repeat(61) }),
        AT_HOME,
      );

      expect(parsed).toEqual({ error: 'Maa on liian pitkä – enintään 60 merkkiä.' });
    });

    // Whitespace is not length: the value stored is the trimmed one.
    it('measures what is left after trimming', () => {
      const city = 'x'.repeat(ADDRESS_LIMITS.shippingCity.max);

      expect(
        parseOwnerResponse(
          form({ choice: '1', handoverMethod: '0', ...address, shippingCity: `   ${city}   ` }),
          AT_HOME,
        ),
      ).toMatchObject({ response: { address: { city } } });
    });
  });

  it('trims what was typed', () => {
    const parsed = parseOwnerResponse(
      form({ choice: '1', handoverMethod: '0', ...address, shippingCity: '  Helsinki  ' }),
      AT_HOME,
    );

    expect(parsed).toMatchObject({ response: { address: { city: 'Helsinki' } } });
  });

  describe("the options a disc's location allows", () => {
    it('accepts collecting from the storage while the disc is there', () => {
      expect(parseOwnerResponse(form({ choice: '1', handoverMethod: '2' }), IN_STORAGE)).toEqual({
        response: { choice: OwnerChoice.WantsItBack, handoverMethod: HandoverMethod.PickedUpFromStorage },
      });
    });

    // The disc is at the admin's house — there is nothing at the storage to
    // collect, so a form posting the option anyway is refused rather than
    // stored and puzzled over later.
    it('refuses collecting from the storage when the disc is not in one', () => {
      expect(parseOwnerResponse(form({ choice: '1', handoverMethod: '2' }), AT_HOME)).toEqual({
        error: 'Valitse, miten haluat kiekon takaisin.',
      });
    });
  });

  describe('what it refuses', () => {
    it.each([
      ['nothing chosen', {}],
      ['an unknown choice', { choice: '7' }],
      ['a choice that is not a number', { choice: 'kylla' }],
    ])('%s', (_reason, fields) => {
      expect(parseOwnerResponse(form(fields), AT_HOME)).toEqual({ error: 'Valitse, haluatko kiekon takaisin.' });
    });

    it('wanting it back without saying how', () => {
      expect(parseOwnerResponse(form({ choice: '1' }), AT_HOME)).toEqual({
        error: 'Valitse, miten haluat kiekon takaisin.',
      });
    });

    it.each(['shippingName', 'shippingStreet', 'shippingPostalCode', 'shippingCity'])(
      'a posting with no %s',
      (missing) => {
        expect(
          parseOwnerResponse(form({ choice: '1', handoverMethod: '0', ...address, [missing]: '  ' }), AT_HOME),
        ).toEqual({ error: 'Täytä postitusta varten nimi, katuosoite, postinumero ja postitoimipaikka.' });
      },
    );

    it.each(['1234', '001000', '00 100', 'abcde'])('a Finnish postal code of %s', (postalCode) => {
      expect(
        parseOwnerResponse(
          form({ choice: '1', handoverMethod: '0', ...address, shippingPostalCode: postalCode }),
          AT_HOME,
        ),
      ).toMatchObject({ error: expect.stringContaining('postinumero') });
    });
  });

  // Five digits is a Finnish rule, and applying it abroad would refuse a
  // correct address.
  it.each(['Ruotsi', 'Sweden', 'Saksa'])('accepts any postal code for %s', (country) => {
    expect(
      parseOwnerResponse(
        form({ choice: '1', handoverMethod: '0', ...address, shippingPostalCode: '114 51', shippingCountry: country }),
        AT_HOME,
      ),
    ).toMatchObject({ response: { address: { postalCode: '114 51', country } } });
  });

  it.each(['', 'Suomi', 'suomi', 'FINLAND', 'fi'])('treats %s as Finland', (country) => {
    expect(
      parseOwnerResponse(
        form({ choice: '1', handoverMethod: '0', ...address, shippingPostalCode: '1234', shippingCountry: country }),
        AT_HOME,
      ),
    ).toMatchObject({ error: expect.stringContaining('postinumero') });
  });
});
