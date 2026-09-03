import { describe, expect, it } from 'vitest';

import { RetrievalMethod, isRetrievalMethod, retrievalMethodLabel, retrievalMethodOptions } from './retrievalMethod';
import { ReturnMethod } from '~/features/discs/return/returnMethod';

describe('retrievalMethod', () => {
  it('offers the two methods in form order', () => {
    expect(retrievalMethodOptions).toEqual([
      { value: 0, label: 'Postitus' },
      { value: 1, label: 'Nouto' },
    ]);
  });

  it.each([
    [RetrievalMethod.ByMail, 'Postitus'],
    [RetrievalMethod.PickedUp, 'Nouto'],
  ])('labels %i as %s', (value, label) => {
    expect(retrievalMethodLabel(value)).toBe(label);
  });

  it.each([null, undefined, 2, -1])('has no label for %s', (value) => {
    expect(retrievalMethodLabel(value)).toBeNull();
  });

  // The two columns are separate but their numbers are meant to line up, so a
  // wish recorded as "postitus" cannot come back out of the return column as
  // "noudettu". Renumbering either without the other would be invisible in the
  // UI, which shows only the labels.
  it('numbers the methods the same way the return method does', () => {
    expect(RetrievalMethod.ByMail).toBe(ReturnMethod.ByMail);
    expect(RetrievalMethod.PickedUp).toBe(ReturnMethod.PickedUp);
  });

  it.each([0, 1])('accepts %i', (value) => {
    expect(isRetrievalMethod(value)).toBe(true);
  });

  it.each<[string, unknown]>([
    ['a string digit', '0'],
    ['an unknown method', 2],
    ['a negative number', -1],
    ['a fraction', 0.5],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_reason, value) => {
    expect(isRetrievalMethod(value)).toBe(false);
  });
});
