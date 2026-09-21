import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import FormControlLabel from './FormControlLabel';
import { Radio, RadioGroup } from './RadioGroup';

function radio(name: string): HTMLInputElement {
  return screen.getByRole('radio', { name }) as HTMLInputElement;
}

// The two modes exist for two different kinds of caller: one that submits the
// group as a plain form field and needs the browser to own the selection, and
// one that keeps the choice in React state and needs it to outlive the form.
describe('RadioGroup — uncontrolled', () => {
  function Uncontrolled() {
    return (
      <form>
        <RadioGroup name="size">
          <FormControlLabel control={<Radio defaultChecked />} value="" label="Any" />
          <FormControlLabel control={<Radio />} value="large" label="Large" />
        </RadioGroup>
      </form>
    );
  }

  it('starts on the radio marked defaultChecked', () => {
    render(<Uncontrolled />);

    expect(radio('Any').checked).toBe(true);
  });

  it('submits the selection under the group name', () => {
    render(<Uncontrolled />);

    fireEvent.click(radio('Large'));

    const form = radio('Large').form as HTMLFormElement;
    expect(new FormData(form).get('size')).toBe('large');
  });

  it('goes back to its default when the form is reset', () => {
    render(<Uncontrolled />);

    fireEvent.click(radio('Large'));
    (radio('Large').form as HTMLFormElement).reset();

    expect(radio('Any').checked).toBe(true);
  });
});

describe('RadioGroup — controlled', () => {
  function Controlled() {
    const [size, setSize] = useState('');
    // State with nothing to do with the radios, so a re-render can be provoked
    // without touching the selection.
    const [unrelated, setUnrelated] = useState(0);

    return (
      <form>
        <RadioGroup name="size" value={size} onChange={setSize}>
          {/* defaultChecked on the wrong option, to prove the group's value
              is what decides. */}
          <FormControlLabel control={<Radio defaultChecked />} value="large" label="Large" />
          <FormControlLabel control={<Radio />} value="" label="Any" />
        </RadioGroup>
        <button type="button" onClick={() => setUnrelated(unrelated + 1)}>
          Something else
        </button>
      </form>
    );
  }

  it('takes what is checked from the group value, not from defaultChecked', () => {
    render(<Controlled />);

    expect(radio('Any').checked).toBe(true);
    expect(radio('Large').checked).toBe(false);
  });

  it('still moves when a radio is clicked, despite carrying readOnly', () => {
    render(<Controlled />);

    fireEvent.click(radio('Large'));

    expect(radio('Large').checked).toBe(true);
  });

  it('reports the selected value rather than the event', () => {
    const seen: string[] = [];

    render(
      <RadioGroup name="size" value="" onChange={(value) => seen.push(value)}>
        <FormControlLabel control={<Radio />} value="large" label="Large" />
        <FormControlLabel control={<Radio />} value="" label="Any" />
      </RadioGroup>,
    );

    fireEvent.click(radio('Large'));

    expect(seen).toEqual(['large']);
  });

  // Worth pinning because it is the trap this mode was added for, and being
  // controlled does NOT close it on its own: form.reset() writes straight to
  // the DOM without going through React, so what is on screen stops agreeing
  // with the state until something renders.
  it('is moved by a form reset anyway, until the next render puts it back', () => {
    render(<Controlled />);

    fireEvent.click(radio('Large'));
    (radio('Large').form as HTMLFormElement).reset();

    // Back to whatever was checked when the group mounted, because that is the
    // only radio React gave a `checked` attribute -- a later selection is set
    // as a property, which a reset discards. So the radios show one answer
    // while the state holds another.
    expect(radio('Large').checked).toBe(false);
    expect(radio('Any').checked).toBe(true);

    // Any render puts it right, including one driven by state that has nothing
    // to do with the radios -- which is what makes this a display bug rather
    // than a lost answer, and what an uncontrolled group would never recover
    // from. Until that render the page is lying, so a form holding a
    // controlled group still must not be reset.
    fireEvent.click(screen.getByRole('button', { name: 'Something else' }));

    expect(radio('Large').checked).toBe(true);
    expect(radio('Any').checked).toBe(false);
  });
});
