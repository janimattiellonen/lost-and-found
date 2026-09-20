import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import FormControlLabel from './FormControlLabel';
import { Radio, RadioGroup } from './RadioGroup';

function radio(name: string): HTMLInputElement {
  return screen.getByRole('radio', { name }) as HTMLInputElement;
}

// The two modes exist for two different callers: NotifyForm submits its group
// as a plain form field and needs the browser to own the selection, while
// AddDiscsPage keeps the choice in React state across entries.
describe('RadioGroup — uncontrolled', () => {
  function Uncontrolled() {
    return (
      <form>
        <RadioGroup name="course">
          <FormControlLabel control={<Radio defaultChecked />} value="" label="Kaikki radat" />
          <FormControlLabel control={<Radio />} value="Tali" label="Tali" />
        </RadioGroup>
      </form>
    );
  }

  it('starts on the radio marked defaultChecked', () => {
    render(<Uncontrolled />);

    expect(radio('Kaikki radat').checked).toBe(true);
  });

  it('submits the selection under the group name', () => {
    render(<Uncontrolled />);

    fireEvent.click(radio('Tali'));

    const form = radio('Tali').form as HTMLFormElement;
    expect(new FormData(form).get('course')).toBe('Tali');
  });

  it('goes back to its default when the form is reset', () => {
    render(<Uncontrolled />);

    fireEvent.click(radio('Tali'));
    (radio('Tali').form as HTMLFormElement).reset();

    expect(radio('Kaikki radat').checked).toBe(true);
  });
});

describe('RadioGroup — controlled', () => {
  function Controlled() {
    const [course, setCourse] = useState('');
    // State with nothing to do with the radios, so a re-render can be provoked
    // without touching the selection.
    const [unrelated, setUnrelated] = useState(0);

    return (
      <form>
        <RadioGroup
          name="course"
          value={course}
          onChange={(event) => setCourse((event.target as HTMLInputElement).value)}
        >
          {/* defaultChecked on the wrong option, to prove the group's value
              is what decides. */}
          <FormControlLabel control={<Radio defaultChecked />} value="Tali" label="Tali" />
          <FormControlLabel control={<Radio />} value="" label="Ei radan tietoa" />
        </RadioGroup>
        <button type="button" onClick={() => setUnrelated(unrelated + 1)}>
          Jotain muuta
        </button>
      </form>
    );
  }

  it('takes what is checked from the group value, not from defaultChecked', () => {
    render(<Controlled />);

    expect(radio('Ei radan tietoa').checked).toBe(true);
    expect(radio('Tali').checked).toBe(false);
  });

  it('still moves when a radio is clicked, despite carrying readOnly', () => {
    render(<Controlled />);

    fireEvent.click(radio('Tali'));

    expect(radio('Tali').checked).toBe(true);
  });

  // Worth pinning because it is the trap this whole change came from, and
  // being controlled does NOT close it on its own: form.reset() writes
  // straight to the DOM without going through React, so what is on screen
  // stops agreeing with the state until something renders.
  it('is moved by a form reset anyway, until the next render puts it back', () => {
    render(<Controlled />);

    fireEvent.click(radio('Tali'));
    (radio('Tali').form as HTMLFormElement).reset();

    // Back to whatever was checked when the group mounted, because that is the
    // only radio React gave a `checked` attribute -- a later selection is set
    // as a property, which a reset discards. So the radios say "Ei radan
    // tietoa" while `course` still says Tali: precisely the original bug.
    expect(radio('Tali').checked).toBe(false);
    expect(radio('Ei radan tietoa').checked).toBe(true);

    // Any render puts it right, including one driven by state that has nothing
    // to do with the radios -- which is what makes this a display bug rather
    // than a lost answer, and what an uncontrolled group would never recover
    // from. Until that render the page is lying, so the entry form still must
    // not be reset.
    fireEvent.click(screen.getByRole('button', { name: 'Jotain muuta' }));

    expect(radio('Tali').checked).toBe(true);
    expect(radio('Ei radan tietoa').checked).toBe(false);
  });
});
