import { describe, expect, it } from 'vitest';

import { discNamePattern, readDiscSearch, toSearchParams } from './discSearch';

describe('readDiscSearch', () => {
  it('is no search when both fields are empty', () => {
    expect(readDiscSearch({ phone: '', disc: '' })).toBeNull();
    expect(readDiscSearch({ phone: null, disc: null })).toBeNull();
  });

  it('leaves out a phone number of fewer than three digits, counting digits only', () => {
    expect(readDiscSearch({ phone: '05-' })).toBeNull();
    expect(readDiscSearch({ phone: '050' })).toEqual({ phone: '050', disc: null });
  });

  it('leaves out a disc name of fewer than two characters, after trimming', () => {
    expect(readDiscSearch({ disc: ' a ' })).toBeNull();
    expect(readDiscSearch({ disc: ' de ' })).toEqual({ phone: null, disc: 'de' });
  });

  it('drops asterisks before counting, since PostgREST would read them as wildcards', () => {
    expect(readDiscSearch({ disc: 'a*' })).toBeNull();
    expect(readDiscSearch({ disc: 'Star*' })).toEqual({ phone: null, disc: 'Star' });
  });

  it('keeps a phone number as its digits, so two typings are one search', () => {
    expect(readDiscSearch({ phone: '050 111-2222' })).toEqual({ phone: '0501112222', disc: null });
  });

  it('keeps a typed + in front, because it changes how the digits are read', () => {
    expect(readDiscSearch({ phone: ' +358 50 111 2222' })).toEqual({ phone: '+358501112222', disc: null });
  });

  it('searches with both fields when both hold enough', () => {
    expect(readDiscSearch({ phone: '2222', disc: 'Destroyer' })).toEqual({ phone: '2222', disc: 'Destroyer' });
  });

  it('cuts a field at the column limit rather than refusing it', () => {
    expect(readDiscSearch({ disc: 'x'.repeat(300) })?.disc).toHaveLength(200);
  });
});

describe('toSearchParams', () => {
  it('names only the fields that take part', () => {
    expect(toSearchParams({ phone: '0501112222', disc: null }).toString()).toBe('phone=0501112222');
    expect(toSearchParams({ phone: null, disc: 'Star' }).toString()).toBe('disc=Star');
  });

  it('is empty for no search', () => {
    expect(toSearchParams(null).toString()).toBe('');
  });
});

describe('discNamePattern', () => {
  it('finds the text anywhere in the name', () => {
    expect(discNamePattern('Star')).toBe('%Star%');
  });

  it('escapes the LIKE wildcards so they match themselves', () => {
    expect(discNamePattern('50%_off\\')).toBe('%50\\%\\_off\\\\%');
  });
});
