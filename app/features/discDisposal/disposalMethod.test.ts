import { describe, expect, it } from 'vitest';

import { DisposalMethod, disposalMethodLabel, disposalMethodOptions, isDisposalMethod } from './disposalMethod';

describe('disposalMethod', () => {
  it('offers the two methods in form order', () => {
    expect(disposalMethodOptions).toEqual([
      { value: 0, label: 'Myydään' },
      { value: 1, label: 'Lahjoitetaan' },
    ]);
  });

  it.each([
    [DisposalMethod.Sold, 'Myydään'],
    [DisposalMethod.Donated, 'Lahjoitetaan'],
  ])('labels %i as %s', (value, label) => {
    expect(disposalMethodLabel(value)).toBe(label);
  });

  it.each([null, undefined, 2, -1])('has no label for %s', (value) => {
    expect(disposalMethodLabel(value)).toBeNull();
  });

  it.each([0, 1])('accepts %i', (value) => {
    expect(isDisposalMethod(value)).toBe(true);
  });

  it.each<[string, unknown]>([
    ['a string digit', '0'],
    ['an unknown method', 2],
    ['a negative number', -1],
    ['a fraction', 0.5],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_reason, value) => {
    expect(isDisposalMethod(value)).toBe(false);
  });
});
