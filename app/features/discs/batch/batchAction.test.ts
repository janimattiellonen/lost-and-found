import { describe, expect, it } from 'vitest';

import { batchActionOutcome, confirmBatchAction, isBatchAction } from './batchAction';

describe('isBatchAction', () => {
  it('accepts the three actions the bar offers', () => {
    expect(isBatchAction('delete')).toBe(true);
    expect(isBatchAction('return')).toBe(true);
    expect(isBatchAction('disposal')).toBe(true);
  });

  it('rejects anything else a request might carry', () => {
    expect(isBatchAction('message')).toBe(false);
    expect(isBatchAction('')).toBe(false);
    expect(isBatchAction(undefined)).toBe(false);
    expect(isBatchAction(1)).toBe(false);
  });
});

describe('confirmBatchAction', () => {
  it('says what is about to happen and to how many discs', () => {
    expect(confirmBatchAction('delete', 12)).toBe('Poistetaanko 12 kiekkoa? Poistoa ei voi peruuttaa.');
    expect(confirmBatchAction('return', 12)).toBe('Merkitäänkö 12 kiekkoa palautetuksi?');
    expect(confirmBatchAction('disposal', 12)).toBe('Merkitäänkö 12 kiekkoa myytäväksi tai lahjoitettavaksi?');
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
    expect(batchActionOutcome('disposal', 3, 3)).toBe('Merkittiin myytäväksi tai lahjoitettavaksi 3 kiekkoa.');
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
