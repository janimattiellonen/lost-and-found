import { describe, expect, it } from 'vitest';

import {
  formatPhoneNumber,
  isTextable,
  normalisePhoneNumber,
  PHONE_NUMBER_FORMAT_ERROR,
  phoneNumberEndsWith,
  phoneSearchDigits,
  phoneSearchPattern,
  toEditablePhoneNumber,
} from '~/phoneNumber';

describe('normalisePhoneNumber', () => {
  it('stores a Finnish number with the country code and no spaces', () => {
    expect(normalisePhoneNumber('050 111 2222')).toEqual({ phoneNumber: '+358501112222' });
    expect(normalisePhoneNumber('0501112222')).toEqual({ phoneNumber: '+358501112222' });
    expect(normalisePhoneNumber('050-111 2222')).toEqual({ phoneNumber: '+358501112222' });
  });

  it('keeps an international number as it is, minus the spaces', () => {
    expect(normalisePhoneNumber('+358 50 111 2222')).toEqual({ phoneNumber: '+358501112222' });
    expect(normalisePhoneNumber('+46 70 111 2222')).toEqual({ phoneNumber: '+46701112222' });
    expect(normalisePhoneNumber('+372 560 333')).toEqual({ phoneNumber: '+372560333' });
  });

  it('reads a leading 00 as the international dialling prefix', () => {
    expect(normalisePhoneNumber('0046 70 111 2222')).toEqual({ phoneNumber: '+46701112222' });
  });

  it('drops the 0 written after +358 by mistake', () => {
    expect(normalisePhoneNumber('+358 050 111 2222')).toEqual({ phoneNumber: '+358501112222' });
  });

  it('keeps the 11-digit Finnish numbers, which are real', () => {
    expect(normalisePhoneNumber('0457 111 2222')).toEqual({ phoneNumber: '+3584571112222' });
  });

  it('keeps four digits as the anonymised tail, a leading 0 included', () => {
    expect(normalisePhoneNumber('2222')).toEqual({ phoneNumber: '2222' });
    expect(normalisePhoneNumber(' 0123 ')).toEqual({ phoneNumber: '0123' });
  });

  it('stores nothing for an empty field', () => {
    expect(normalisePhoneNumber('')).toEqual({ phoneNumber: null });
    expect(normalisePhoneNumber('   ')).toEqual({ phoneNumber: null });
  });

  it('keeps a "?" in place of a digit that could not be read', () => {
    expect(normalisePhoneNumber('050 111 ?222')).toEqual({ phoneNumber: '+35850111?222' });
    expect(normalisePhoneNumber('050 111 22??')).toEqual({ phoneNumber: '+3585011122??' });
  });

  it('refuses a number whose first digit could not be read, since its country is unknown', () => {
    expect(normalisePhoneNumber('????2222')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
    expect(normalisePhoneNumber('+?58501112222')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it('refuses brackets and words', () => {
    expect(normalisePhoneNumber('(555)111-2222')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
    expect(normalisePhoneNumber('050 111 2222 äiti')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it('refuses a number with neither a 0 nor a + in front, rather than guess its country', () => {
    expect(normalisePhoneNumber('51112222')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
    expect(normalisePhoneNumber('555-111-2222')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it('refuses a fragment too short to be a number, and one too long', () => {
    expect(normalisePhoneNumber('050 111')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
    expect(normalisePhoneNumber('+358 050 111')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
    expect(normalisePhoneNumber('045 111 222')).toEqual({ phoneNumber: '+35845111222' });
    expect(normalisePhoneNumber('+1234567890123456')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it('refuses a country code starting with 0', () => {
    expect(normalisePhoneNumber('+0501112222')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it('gives back what it stores when the stored form is typed again', () => {
    for (const stored of ['+358501112222', '+46701112222', '2222']) {
      expect(normalisePhoneNumber(stored)).toEqual({ phoneNumber: stored });
    }
  });
});

describe('formatPhoneNumber', () => {
  it('shows a Finnish number in domestic form, grouped prefix, middle, last four', () => {
    expect(formatPhoneNumber('+358501112222')).toBe('050 111 2222');
    expect(formatPhoneNumber('+3584571112222')).toBe('045 7111 2222');
  });

  it('leaves a Finnish number of another length ungrouped', () => {
    expect(formatPhoneNumber('+35845111222')).toBe('045111222');
  });

  it('keeps the country code of a foreign number and groups the rest in threes', () => {
    expect(formatPhoneNumber('+46701112222')).toBe('+46 701 112 222');
    expect(formatPhoneNumber('+372560333')).toBe('+372 560 333');
    expect(formatPhoneNumber('+3725551111')).toBe('+372 555 1111');
  });

  it('knows where a one- and a two-digit country code ends', () => {
    expect(formatPhoneNumber('+15551112222')).toBe('+1 555 111 2222');
    expect(formatPhoneNumber('+4915111222333')).toBe('+49 151 112 223 33');
  });

  it('groups a number with an unreadable digit like any other', () => {
    expect(formatPhoneNumber('+35850111?222')).toBe('050 111 ?222');
  });

  it('shows the anonymised tail the way the public list does', () => {
    expect(formatPhoneNumber('2222')).toBe('****2222');
  });

  it('shows a value in none of the stored forms exactly as stored', () => {
    expect(formatPhoneNumber('050 111 22?2')).toBe('050 111 22?2');
    expect(formatPhoneNumber('0501112222')).toBe('0501112222');
  });

  it('renders a missing number as nothing', () => {
    expect(formatPhoneNumber(null)).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
    expect(formatPhoneNumber('')).toBe('');
  });

  it('shows what normalises back to the same stored number', () => {
    // The edit fields open on the shown form, so it has to survive a save.
    for (const stored of [
      '+358501112222',
      '+3584571112222',
      '+46701112222',
      '+372560333',
      '+15551112222',
      '+35850111?222',
    ]) {
      expect(normalisePhoneNumber(formatPhoneNumber(stored))).toEqual({ phoneNumber: stored });
    }
  });
});

describe('isTextable', () => {
  it('is true for a whole number', () => {
    expect(isTextable('+358501112222')).toBe(true);
  });

  it('is false for a number with an unreadable digit, the anonymised tail, or none', () => {
    expect(isTextable('+35850111?222')).toBe(false);
    expect(isTextable('2222')).toBe(false);
    expect(isTextable(null)).toBe(false);
  });
});

describe('toEditablePhoneNumber', () => {
  it('opens a whole number in its shown form', () => {
    expect(toEditablePhoneNumber('+358501112222')).toBe('050 111 2222');
  });

  it('opens the anonymised tail as its digits, which save again', () => {
    expect(toEditablePhoneNumber('2222')).toBe('2222');
  });

  it('opens a missing number empty', () => {
    expect(toEditablePhoneNumber(null)).toBe('');
  });
});

describe('phoneSearchDigits', () => {
  it('drops the domestic 0 from a whole Finnish number', () => {
    expect(phoneSearchDigits('050 111 2222')).toBe('501112222');
  });

  it('keeps the country code of an international one', () => {
    expect(phoneSearchDigits('+358 50 111 2222')).toBe('358501112222');
    expect(phoneSearchDigits('0046 70 111')).toBe('4670111');
  });

  it('keeps four digits or fewer whole, as a tail', () => {
    expect(phoneSearchDigits('0123')).toBe('0123');
    expect(phoneSearchDigits('222')).toBe('222');
  });
});

describe('phoneNumberEndsWith', () => {
  it('finds a stored Finnish number by its domestic form', () => {
    expect(phoneNumberEndsWith('+358501112222', '0501112222')).toBe(true);
    expect(phoneNumberEndsWith('+358501112222', '050 111 2222')).toBe(true);
  });

  it('finds it by its last digits', () => {
    expect(phoneNumberEndsWith('+358501112222', '2222')).toBe(true);
    expect(phoneNumberEndsWith('+358501112222', '1112222')).toBe(true);
  });

  it('works on the four digits an anonymous visitor receives', () => {
    expect(phoneNumberEndsWith('2222', '2222')).toBe(true);
    expect(phoneNumberEndsWith('2222', '3333')).toBe(false);
  });

  it('lets an unreadable digit match any digit', () => {
    expect(phoneNumberEndsWith('+35850111?222', '0501112222')).toBe(true);
    expect(phoneNumberEndsWith('+35850111?222', '0501119222')).toBe(true);
    expect(phoneNumberEndsWith('+35850111?222', '0501113333')).toBe(false);
  });

  it('does not match on digits from the middle', () => {
    expect(phoneNumberEndsWith('+358501112222', '5011')).toBe(false);
  });

  it('matches nothing for a search with no digits, or a disc with no number', () => {
    expect(phoneNumberEndsWith('+358501112222', 'abc')).toBe(false);
    expect(phoneNumberEndsWith(null, '2222')).toBe(false);
  });
});

describe('phoneSearchPattern', () => {
  it('matches the end of a number, a stored "?" standing for any digit', () => {
    expect(phoneSearchPattern('2222')).toBe('([2?][2?][2?][2?])$');
  });

  it('also matches a stored four-digit tail when a whole number is searched', () => {
    expect(phoneSearchPattern('050 111 2222')).toBe('([5?][0?][1?][1?][1?][2?][2?][2?][2?]|^2222)$');
  });

  // The front page filters in the browser with phoneNumberEndsWith, "Kaikki
  // kiekot" in the database with the pattern. The same cases go through both,
  // so the two pages cannot drift apart.
  describe('agrees with phoneNumberEndsWith on every stored number but a tail', () => {
    const stored = ['+358501112222', '+35850111?222', '+46701112222', '+358457112222'];
    const searches = [
      '0501112222',
      '050 111 2222',
      '+358 50 111 2222',
      '1112222',
      '2222',
      '222',
      '50111',
      '0046 70 111 2222',
    ];

    for (const number of stored) {
      for (const search of searches) {
        it(`"${search}" against ${number}`, () => {
          expect(new RegExp(phoneSearchPattern(search)).test(number)).toBe(phoneNumberEndsWith(number, search));
        });
      }
    }
  });

  it('finds a tail by the whole number it was cut from, Finnish or foreign', () => {
    expect(new RegExp(phoneSearchPattern('0501112222')).test('2222')).toBe(true);
    expect(new RegExp(phoneSearchPattern('+46 70 111 2222')).test('2222')).toBe(true);
    expect(new RegExp(phoneSearchPattern('0501112222')).test('1222')).toBe(false);
  });

  it('finds a tail by its own digits, or fewer', () => {
    expect(new RegExp(phoneSearchPattern('2222')).test('2222')).toBe(true);
    expect(new RegExp(phoneSearchPattern('222')).test('2222')).toBe(true);
  });

  // A pause halfway through typing must not list every disc whose tail happens
  // to be the last four digits typed so far.
  it('does not look for tails while the number is still incomplete', () => {
    expect(phoneSearchPattern('050111')).toBe('([5?][0?][1?][1?][1?])$');
    expect(new RegExp(phoneSearchPattern('050111')).test('0111')).toBe(false);
    expect(new RegExp(phoneSearchPattern('1112222')).test('2222')).toBe(false);
  });

  it('does not take a whole number for a tail', () => {
    expect(new RegExp(phoneSearchPattern('0501112222')).test('+358409992222')).toBe(false);
  });
});
