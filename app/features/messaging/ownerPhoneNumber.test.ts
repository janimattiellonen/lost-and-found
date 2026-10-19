import { describe, expect, it } from 'vitest';

import { MAX_FIELD_LENGTH } from '~/discFieldLimits';
import { parseOwnerPhoneNumber } from '~/features/messaging/ownerPhoneNumber';
import { PHONE_NUMBER_FORMAT_ERROR } from '~/phoneNumber';

describe('parseOwnerPhoneNumber', () => {
  it('stores the number in its stored form', () => {
    expect(parseOwnerPhoneNumber('  050 111 2222 ')).toEqual({ phoneNumber: '+358501112222' });
  });

  it('keeps the anonymised four-digit tail', () => {
    expect(parseOwnerPhoneNumber('2222')).toEqual({ phoneNumber: '2222' });
  });

  it('refuses a number with unreadable digits', () => {
    expect(parseOwnerPhoneNumber('050 111 22?2')).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it.each([
    ['an empty string', ''],
    ['only spaces', '   '],
    ['null', null],
    ['a number type', 501234567],
  ])('refuses %s', (_reason, value) => {
    expect(parseOwnerPhoneNumber(value)).toEqual({ error: 'Puhelinnumero on pakollinen.' });
  });

  it('refuses the longest value the column allows when it is no phone number', () => {
    expect(parseOwnerPhoneNumber('1'.repeat(MAX_FIELD_LENGTH))).toEqual({ error: PHONE_NUMBER_FORMAT_ERROR });
  });

  it('refuses one character more', () => {
    expect(parseOwnerPhoneNumber('1'.repeat(MAX_FIELD_LENGTH + 1))).toEqual({
      error: `Puhelinnumero on liian pitkä (enintään ${MAX_FIELD_LENGTH} merkkiä).`,
    });
  });
});
