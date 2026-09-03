import { describe, expect, it } from 'vitest';

import { formatPostageFee, POSTAGE_FEE_CENTS } from './shipping';

/** Intl separates the amount from the sign with a non-breaking space. */
const plain = (formatted: string): string => formatted.replace(/\u00a0/g, ' ');

describe('formatPostageFee', () => {
  it('writes cents the Finnish way, a comma and a euro sign', () => {
    expect(plain(formatPostageFee(630))).toBe('6,30 €');
  });

  it('keeps both decimals for a round amount', () => {
    expect(plain(formatPostageFee(700))).toBe('7,00 €');
  });

  it('carries into euros', () => {
    expect(plain(formatPostageFee(1250))).toBe('12,50 €');
  });

  it('formats the configured fee by default', () => {
    expect(formatPostageFee()).toBe(formatPostageFee(POSTAGE_FEE_CENTS));
  });
});
