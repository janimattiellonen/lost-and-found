import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FieldError from './FieldError';

// The contract is the guard: before this component existed, every call site
// wrote its own `{error && <p …>}`, and that conditional was half of what kept
// being repeated. A caller now hands over whatever it has.
describe('FieldError', () => {
  it('shows the message it is given', () => {
    render(<FieldError>Kenttä on pakollinen</FieldError>);

    expect(screen.getByText('Kenttä on pakollinen')).toBeDefined();
  });

  it('renders nothing when there is no error, so a caller need not check first', () => {
    for (const nothing of [undefined, null, '']) {
      const { container, unmount } = render(<FieldError>{nothing}</FieldError>);
      expect(container.innerHTML).toBe('');
      unmount();
    }
  });
});
