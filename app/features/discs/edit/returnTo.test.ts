import { describe, expect, it } from 'vitest';

import { editDiscPath, safeReturnTo } from './returnTo';

describe('safeReturnTo', () => {
  it('keeps a path inside this app, query string included', () => {
    expect(safeReturnTo('/admin/discs?phone=0501112222&disc=Star')).toBe('/admin/discs?phone=0501112222&disc=Star');
  });

  it('falls back to the disc list when there is nothing', () => {
    expect(safeReturnTo(null)).toBe('/');
    expect(safeReturnTo('')).toBe('/');
  });

  it('refuses a full address', () => {
    expect(safeReturnTo('https://example.com/')).toBe('/');
  });

  it('refuses the forms a browser reads as another site', () => {
    expect(safeReturnTo('//example.com')).toBe('/');
    expect(safeReturnTo('/\\example.com')).toBe('/');
    // Browsers strip tabs and line breaks before reading an address.
    expect(safeReturnTo('/\t/example.com')).toBe('/');
    expect(safeReturnTo('/\n/example.com')).toBe('/');
  });

  it('refuses a relative path, which would resolve against the edit page', () => {
    expect(safeReturnTo('admin/discs')).toBe('/');
  });
});

describe('editDiscPath', () => {
  it('is the bare edit page when the way back is the disc list', () => {
    expect(editDiscPath('06adc151-9f6e-48a4-9abf-23e455150c38')).toBe(
      '/discs/06adc151-9f6e-48a4-9abf-23e455150c38/edit',
    );
  });

  it('carries the way back, encoded, for safeReturnTo to read', () => {
    const path = editDiscPath('06adc151-9f6e-48a4-9abf-23e455150c38', '/admin/discs?phone=0501112222&disc=Star');
    const returnTo = new URL(path, 'http://localhost').searchParams.get('returnTo');

    expect(path).toBe(
      '/discs/06adc151-9f6e-48a4-9abf-23e455150c38/edit?returnTo=%2Fadmin%2Fdiscs%3Fphone%3D0501112222%26disc%3DStar',
    );
    expect(safeReturnTo(returnTo)).toBe('/admin/discs?phone=0501112222&disc=Star');
  });
});
