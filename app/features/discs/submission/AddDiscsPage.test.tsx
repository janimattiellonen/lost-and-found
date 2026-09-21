import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import AddDiscsPage from './AddDiscsPage';
import { clearDraft } from './draftStorage';

// The draft store is a module-level singleton backed by localStorage, so one
// test's rows would otherwise be the next one's starting state.
afterEach(() => {
  clearDraft();
  localStorage.clear();
});

const courses = ['Tali', 'Kivikko'];

function entryField(): HTMLInputElement {
  return screen.getByLabelText('Kiekon tiedot') as HTMLInputElement;
}

/**
 * Types a line into "Kiekon tiedot" and enters it.
 *
 * jsdom does not implement a form's implicit submission, so pressing Enter in
 * the field is stood in for by submitting the form it belongs to — which is
 * what Enter does in a browser, and what the page listens for.
 */
function enterDisc(text: string): void {
  const field = entryField();

  fireEvent.change(field, { target: { value: text } });
  fireEvent.submit(field.form as HTMLFormElement);
}

function radio(name: string): HTMLInputElement {
  return screen.getByRole('radio', { name }) as HTMLInputElement;
}

describe('AddDiscsPage', () => {
  it('keeps the chosen course selected after a disc is entered', () => {
    render(<AddDiscsPage courses={courses} />);

    fireEvent.click(radio('Tali'));
    enterDisc('Star Destroyer punainen');

    // The radios sit in the same form as the entry field, so clearing that
    // field must not clear them: the row is filed under Tali and the radios
    // have to say so too.
    expect(radio('Tali').checked).toBe(true);
    expect(radio('Ei radan tietoa').checked).toBe(false);
  });

  it('clears the entry field so the next disc can be typed straight away', () => {
    render(<AddDiscsPage courses={courses} />);

    enterDisc('Star Destroyer punainen');

    expect(entryField().value).toBe('');
  });

  // A single-course club gets no radio row at all, so entering a disc must not
  // depend on one being there.
  it('enters a disc for a club that records no courses', () => {
    render(<AddDiscsPage courses={[]} />);

    enterDisc('Star Destroyer punainen');

    expect(entryField().value).toBe('');
    expect(screen.getByRole('button', { name: 'Kiekko: Destroyer' })).toBeDefined();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('files the entered disc under the chosen course', () => {
    render(<AddDiscsPage courses={courses} />);

    fireEvent.click(radio('Kivikko'));
    enterDisc('Star Destroyer punainen');

    expect(screen.getByRole('cell', { name: 'Kivikko' })).toBeDefined();
  });
});
