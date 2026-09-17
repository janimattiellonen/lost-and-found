import { formatPhoneNumber, toDiallablePhoneNumber } from '~/utils';

import type { JSX } from 'react';

type Props = {
  phoneNumber: string | null;
  name: string | null;
};

/**
 * One line of "how to reach this person": a tappable number with the name after
 * it in brackets.
 *
 * A link rather than plain digits, and an `sms:` link rather than a `tel:` one:
 * the number is here to be texted from the same phone the page is read on, so
 * tapping it opens a message rather than placing a call. That is a product
 * decision, not an implementation detail — see CHANGELOG.md.
 *
 * The number comes first because it is what gets tapped, and only the digits are
 * inside the anchor; the name sits outside it. With neither value there is no
 * line at all, so a caller can hand over whatever it has without guarding first.
 */
export default function ContactLine({ phoneNumber, name }: Props): JSX.Element | null {
  if (!phoneNumber && !name) {
    return null;
  }

  return (
    <span className="text-sm text-fg-body">
      {phoneNumber && (
        <a href={`sms:${toDiallablePhoneNumber(phoneNumber)}`} className="text-fg-link underline">
          {formatPhoneNumber(phoneNumber)}
        </a>
      )}
      {name && (phoneNumber ? ` (${name})` : name)}
    </span>
  );
}
