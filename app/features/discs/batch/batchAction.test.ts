import { describe, expect, it } from 'vitest';

import { disposalMethodLabel } from '~/features/discs/disposal/disposalMethod';

import { batchActionOutcome, confirmBatchAction, disposalMethodFor, isBatchAction } from './batchAction';

describe('isBatchAction', () => {
  it('accepts the four actions the bar offers', () => {
    expect(isBatchAction('delete')).toBe(true);
    expect(isBatchAction('return')).toBe(true);
    expect(isBatchAction('sell')).toBe(true);
    expect(isBatchAction('donate')).toBe(true);
  });

  it('rejects anything else a request might carry', () => {
    expect(isBatchAction('message')).toBe(false);
    expect(isBatchAction('disposal')).toBe(false);
    expect(isBatchAction('')).toBe(false);
    expect(isBatchAction(undefined)).toBe(false);
    expect(isBatchAction(1)).toBe(false);
  });
});

describe('confirmBatchAction', () => {
  it('says what is about to happen and to how many discs', () => {
    expect(confirmBatchAction('delete', 12)).toBe('Poistetaanko 12 kiekkoa? Poistoa ei voi peruuttaa.');
    expect(confirmBatchAction('return', 12)).toBe('Merkitäänkö 12 kiekkoa palautetuksi?');
    expect(confirmBatchAction('sell', 12)).toBe('Merkitäänkö 12 kiekkoa myytäväksi?');
    expect(confirmBatchAction('donate', 12)).toBe('Merkitäänkö 12 kiekkoa lahjoitettavaksi?');
  });

  it('counts one disc in the singular', () => {
    expect(confirmBatchAction('delete', 1)).toBe('Poistetaanko 1 kiekko? Poistoa ei voi peruuttaa.');
    expect(confirmBatchAction('return', 1)).toBe('Merkitäänkö 1 kiekko palautetuksi?');
  });
});

describe('batchActionOutcome', () => {
  it('reports what was done when every disc was reached', () => {
    expect(batchActionOutcome('delete', 12, 12)).toBe('Poistettiin 12 kiekkoa.');
    expect(batchActionOutcome('return', 1, 1)).toBe('Merkittiin palautetuksi 1 kiekko.');
    expect(batchActionOutcome('sell', 3, 3)).toBe('Merkittiin myytäväksi 3 kiekkoa.');
    expect(batchActionOutcome('donate', 3, 3)).toBe('Merkittiin lahjoitettavaksi 3 kiekkoa.');
  });

  it('reports the shortfall rather than the number asked for', () => {
    expect(batchActionOutcome('delete', 10, 12)).toBe(
      'Poistettiin 10 kiekkoa. 2 kiekkoa jäi käsittelemättä – kiekkoja ei löytynyt tai niitä ei voitu muuttaa.',
    );
    expect(batchActionOutcome('return', 1, 2)).toBe(
      'Merkittiin palautetuksi 1 kiekko. 1 kiekko jäi käsittelemättä – kiekkoja ei löytynyt tai niitä ei voitu muuttaa.',
    );
  });
});

describe('disposalMethodFor', () => {
  // Against the label rather than the number: the point is that a disc the
  // club means to sell is not recorded as one it means to give away.
  it('records the fate the action names', () => {
    expect(disposalMethodLabel(disposalMethodFor('sell'))).toBe('Myydään');
    expect(disposalMethodLabel(disposalMethodFor('donate'))).toBe('Lahjoitetaan');
  });
});
