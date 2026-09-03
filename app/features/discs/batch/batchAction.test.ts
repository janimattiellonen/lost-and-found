import { describe, expect, it } from 'vitest';

import { disposalMethodLabel } from '~/features/discs/disposal/disposalMethod';
import { returnMethodLabel } from '~/features/discs/return/returnMethod';

import { batchActionOrder, batchActionOutcome, confirmBatchAction, isBatchAction, markFor } from './batchAction';

describe('isBatchAction', () => {
  it('accepts the five actions the dropdown offers', () => {
    expect(batchActionOrder.every(isBatchAction)).toBe(true);
    expect(batchActionOrder).toHaveLength(5);
  });

  it('rejects anything else a request might carry', () => {
    // 'message' is the dropdown's sixth entry but not a batch write, and
    // 'return' and 'disposal' are the names from before either mark carried
    // its method.
    expect(isBatchAction('message')).toBe(false);
    expect(isBatchAction('return')).toBe(false);
    expect(isBatchAction('disposal')).toBe(false);
    expect(isBatchAction('')).toBe(false);
    expect(isBatchAction(undefined)).toBe(false);
    expect(isBatchAction(1)).toBe(false);
  });
});

describe('confirmBatchAction', () => {
  it('says what is about to happen and to how many discs', () => {
    expect(confirmBatchAction('delete', 12)).toBe('Poistetaanko 12 kiekkoa? Poistoa ei voi peruuttaa.');
    expect(confirmBatchAction('returnByMail', 12)).toBe('Merkitäänkö 12 kiekkoa palautetuksi (postitettu)?');
    expect(confirmBatchAction('returnPickedUp', 12)).toBe('Merkitäänkö 12 kiekkoa palautetuksi (noudettu)?');
    expect(confirmBatchAction('sell', 12)).toBe('Merkitäänkö 12 kiekkoa myytäväksi?');
    expect(confirmBatchAction('donate', 12)).toBe('Merkitäänkö 12 kiekkoa lahjoitettavaksi?');
  });

  it('counts one disc in the singular', () => {
    expect(confirmBatchAction('delete', 1)).toBe('Poistetaanko 1 kiekko? Poistoa ei voi peruuttaa.');
    expect(confirmBatchAction('returnByMail', 1)).toBe('Merkitäänkö 1 kiekko palautetuksi (postitettu)?');
  });
});

describe('batchActionOutcome', () => {
  it('reports what was done when every disc was reached', () => {
    expect(batchActionOutcome('delete', 12, 12)).toBe('Poistettiin 12 kiekkoa.');
    expect(batchActionOutcome('returnPickedUp', 1, 1)).toBe('Merkittiin palautetuksi (noudettu) 1 kiekko.');
    expect(batchActionOutcome('sell', 3, 3)).toBe('Merkittiin myytäväksi 3 kiekkoa.');
    expect(batchActionOutcome('donate', 3, 3)).toBe('Merkittiin lahjoitettavaksi 3 kiekkoa.');
  });

  it('reports the shortfall rather than the number asked for', () => {
    expect(batchActionOutcome('delete', 10, 12)).toBe(
      'Poistettiin 10 kiekkoa. 2 kiekkoa jäi käsittelemättä – kiekkoja ei löytynyt tai niitä ei voitu muuttaa.',
    );
    expect(batchActionOutcome('returnByMail', 1, 2)).toBe(
      'Merkittiin palautetuksi (postitettu) 1 kiekko. 1 kiekko jäi käsittelemättä – kiekkoja ei löytynyt tai niitä ei voitu muuttaa.',
    );
  });
});

// Against the labels rather than the numbers: the point is that a disc the club
// means to sell is not recorded as one it means to give away, and one handed
// over at the course is not recorded as posted. Nothing in the UI shows the
// stored smallint, so an inversion would be invisible.
// Two readers that also assert which columns the action writes: a mark of the
// wrong kind cannot reach the label call.
function disposalLabelFor(action: 'sell' | 'donate'): string | null {
  const mark = markFor(action);

  if (mark?.columns !== 'disposal') {
    throw new Error(`${action} should record a disposal, got ${JSON.stringify(mark)}`);
  }

  return disposalMethodLabel(mark.method);
}

function returnLabelFor(action: 'returnByMail' | 'returnPickedUp'): string | null {
  const mark = markFor(action);

  if (mark?.columns !== 'return') {
    throw new Error(`${action} should record a return, got ${JSON.stringify(mark)}`);
  }

  return returnMethodLabel(mark.method);
}

describe('markFor', () => {
  it('records the fate a release names', () => {
    expect(disposalLabelFor('sell')).toBe('Myydään');
    expect(disposalLabelFor('donate')).toBe('Lahjoitetaan');
  });

  it('records the way a return names', () => {
    expect(returnLabelFor('returnByMail')).toBe('Postitettu');
    expect(returnLabelFor('returnPickedUp')).toBe('Noudettu');
  });

  it('has no mark for a delete, which records nothing', () => {
    expect(markFor('delete')).toBeNull();
  });

  it('has a mark for every action that is not a delete', () => {
    expect(batchActionOrder.filter((action) => markFor(action) === null)).toEqual(['delete']);
  });
});
