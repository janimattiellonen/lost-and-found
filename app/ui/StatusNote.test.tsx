import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StatusNote from './StatusNote';

// The rule worth testing here is not what the box looks like — the colours are
// tokens, and whether a token holds the right hex is settled in
// `app/styles/palette.test.ts` and by the build. What this file pins down is the
// behaviour the component added when it replaced four hand-built copies:
//
//  * the live region exists whether or not there is a message, so a screen
//    reader announces text that arrives later instead of missing an element
//    that appeared at the same moment as its text;
//  * no box is drawn for an empty region, so it takes no room;
//  * the two outcomes are told apart, and told apart consistently.
//
// StyleX class names are content hashes, so the test compares them to each other
// rather than asserting any particular name.
describe('StatusNote', () => {
  it('keeps the live region in the page when there is nothing to report', () => {
    render(<StatusNote variant="success">{null}</StatusNote>);

    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.querySelector('p')).toBeNull();
  });

  it('draws a box once there is a message', () => {
    render(<StatusNote variant="success">Kiekon tiedot tallennettu.</StatusNote>);

    const box = screen.getByText('Kiekon tiedot tallennettu.');
    expect(box.tagName).toBe('P');
    expect(box.className).not.toBe('');
  });

  it('gives the two outcomes different styles', () => {
    const { unmount } = render(<StatusNote variant="success">Sama teksti</StatusNote>);
    const success = screen.getByText('Sama teksti').className;
    unmount();

    render(<StatusNote variant="error">Sama teksti</StatusNote>);
    const error = screen.getByText('Sama teksti').className;

    expect(error).not.toBe(success);
  });

  it('gives the same outcome the same styles, whatever the message says', () => {
    const { unmount } = render(<StatusNote variant="error">Ensimmäinen virhe</StatusNote>);
    const first = screen.getByText('Ensimmäinen virhe').className;
    unmount();

    render(<StatusNote variant="error">Toinen virhe</StatusNote>);
    expect(screen.getByText('Toinen virhe').className).toBe(first);
  });

  it('reports success when a caller does not say which outcome it means', () => {
    const { unmount } = render(<StatusNote variant="success">Teksti</StatusNote>);
    const explicit = screen.getByText('Teksti').className;
    unmount();

    render(<StatusNote>Teksti</StatusNote>);
    expect(screen.getByText('Teksti').className).toBe(explicit);
  });

  it('puts a caller class on the live region, where a page keeps its spacing', () => {
    render(
      <StatusNote variant="success" className="mb-4">
        Teksti
      </StatusNote>,
    );

    expect(screen.getByRole('status').className).toBe('mb-4');
  });
});
