import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ContactLine from './ContactLine';

// The contract worth pinning is the link: tapping the number has to open a
// message rather than place a call, which is a product decision rather than an
// implementation detail, and the digits behind the `sms:` scheme have to be
// stripped of the grouping spaces the number is displayed with.
describe('ContactLine', () => {
  it('links the number as a message, not a call, and without its grouping spaces', () => {
    render(<ContactLine phoneNumber="0501234567" name={null} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('sms:0501234567');
    expect(link.textContent).toBe('050 123 4567');
  });

  it('strips the spaces from a number that was stored with them', () => {
    render(<ContactLine phoneNumber="050 123 4567" name={null} />);

    expect(screen.getByRole('link').getAttribute('href')).toBe('sms:0501234567');
  });

  it('puts the name after the number, in brackets', () => {
    render(<ContactLine phoneNumber="0501234567" name="Matti" />);

    expect(screen.getByText(/Matti/).textContent).toBe('050 123 4567 (Matti)');
  });

  it('shows a name on its own without brackets when there is no number', () => {
    render(<ContactLine phoneNumber={null} name="Matti" />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Matti')).toBeDefined();
  });

  it('renders nothing at all when it has neither, so a caller need not check first', () => {
    const { container } = render(<ContactLine phoneNumber={null} name={null} />);

    expect(container.innerHTML).toBe('');
  });
});
