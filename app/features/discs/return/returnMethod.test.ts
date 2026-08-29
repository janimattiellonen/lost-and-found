import { describe, expect, it } from 'vitest';

import { ReturnMethod, isReturnMethod, returnMethodLabel, returnMethodOptions } from './returnMethod';

describe('returnMethod', () => {
  it('offers the two methods in form order', () => {
    expect(returnMethodOptions).toEqual([
      { value: 0, label: 'Postitettu' },
      { value: 1, label: 'Noudettu' },
    ]);
  });

  it.each([
    [ReturnMethod.ByMail, 'Postitettu'],
    [ReturnMethod.PickedUp, 'Noudettu'],
  ])('labels %i as %s', (value, label) => {
    expect(returnMethodLabel(value)).toBe(label);
  });

  it.each([null, undefined, 2, -1])('has no label for %s', (value) => {
    expect(returnMethodLabel(value)).toBeNull();
  });

  it.each([0, 1])('accepts %i', (value) => {
    expect(isReturnMethod(value)).toBe(true);
  });

  it.each<[string, unknown]>([
    ['a string digit', '0'],
    ['an unknown method', 2],
    ['a negative number', -1],
    ['a fraction', 0.5],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_reason, value) => {
    expect(isReturnMethod(value)).toBe(false);
  });
});
