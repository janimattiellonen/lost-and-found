import { describe, expect, it } from 'vitest';

import { MAX_FIELD_LENGTH } from '~/discFieldLimits';
import { parseOwnerPhoneNumber } from '~/features/messaging/ownerPhoneNumber';

describe('parseOwnerPhoneNumber', () => {
  it('keeps the number as typed, trimmed', () => {
    expect(parseOwnerPhoneNumber('  050 123 4567 ')).toEqual({ phoneNumber: '050 123 4567' });
  });

  it('accepts a number with a note, as imported rows have', () => {
    expect(parseOwnerPhoneNumber('050 123 4567 (äiti)')).toEqual({ phoneNumber: '050 123 4567 (äiti)' });
  });

  it.each([
    ['an empty string', ''],
    ['only spaces', '   '],
    ['null', null],
    ['a number type', 501234567],
  ])('refuses %s', (_reason, value) => {
    expect(parseOwnerPhoneNumber(value)).toEqual({ error: 'Puhelinnumero on pakollinen.' });
  });

  it('accepts the longest number the column allows', () => {
    expect(parseOwnerPhoneNumber('1'.repeat(MAX_FIELD_LENGTH)).error).toBeUndefined();
  });

  it('refuses one character more', () => {
    expect(parseOwnerPhoneNumber('1'.repeat(MAX_FIELD_LENGTH + 1))).toEqual({
      error: `Puhelinnumero on liian pitkä (enintään ${MAX_FIELD_LENGTH} merkkiä).`,
    });
  });
});
