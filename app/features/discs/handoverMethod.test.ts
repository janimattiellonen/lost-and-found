import { describe, expect, it } from 'vitest';

import {
  HandoverMethod,
  handoverMethodLabel,
  handoverMethodOptions,
  isHandoverMethod,
  needsFetchingFromStorage,
} from './handoverMethod';
import { ReturnMethod } from './return/returnMethod';

describe('handoverMethod', () => {
  it('offers the three ways a disc can get back to its owner', () => {
    expect(handoverMethodOptions).toEqual([
      { value: 0, label: 'Postitus' },
      { value: 1, label: 'Nouto (minulta)' },
      { value: 2, label: 'Nouto varastolta' },
    ]);
  });

  // discs.return_method has held 0 and 1 with these meanings since the Google
  // Sheet, and the sheet-imported rows cannot be renumbered. Nothing in the UI
  // shows the number, so a swap here would be invisible.
  it('keeps the two numbers discs.return_method already stores', () => {
    expect(HandoverMethod.ByMail).toBe(ReturnMethod.ByMail);
    expect(HandoverMethod.PickedUpFromHome).toBe(ReturnMethod.PickedUp);
  });

  it.each([
    [HandoverMethod.ByMail, 'Postitus'],
    [HandoverMethod.PickedUpFromHome, 'Nouto (minulta)'],
    [HandoverMethod.PickedUpFromStorage, 'Nouto varastolta'],
  ])('labels %i as %s', (value, label) => {
    expect(handoverMethodLabel(value)).toBe(label);
  });

  it.each([0, 1, 2])('accepts %i', (value) => {
    expect(isHandoverMethod(value)).toBe(true);
  });

  it.each<[string, unknown]>([
    ['an unknown method', 3],
    ['a string digit', '1'],
    ['null', null],
  ])('rejects %s', (_reason, value) => {
    expect(isHandoverMethod(value)).toBe(false);
  });

  describe('needsFetchingFromStorage', () => {
    it.each([HandoverMethod.ByMail, HandoverMethod.PickedUpFromHome])('is true for %i', (method) => {
      expect(needsFetchingFromStorage(method)).toBe(true);
    });

    // The whole reason the two concepts are separate: an owner collecting from
    // the storage is not an errand for the admin.
    it('is false for collecting from the storage', () => {
      expect(needsFetchingFromStorage(HandoverMethod.PickedUpFromStorage)).toBe(false);
    });
  });
});
