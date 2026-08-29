/**
 * A Finnish number starts with 0, an international one with +. Both may be
 * written with spaces or hyphens between the groups. Requiring a leading 0 or +
 * is what keeps "Mako3" and a weight like "175" out of the results.
 */
const CANDIDATE = /(?:\+|\b0)[\d\s-]{5,}\d/g;

const MIN_DIGITS = 7;
const MAX_DIGITS = 15;

export type PhoneMatch = {
  /** Digits only, keeping a leading "+" for international numbers. */
  value: string;
  start: number;
  end: number;
};

export function findPhoneNumber(input: string): PhoneMatch | null {
  for (const match of input.matchAll(CANDIDATE)) {
    const raw = match[0];
    const compact = raw.replace(/[\s-]/g, '');
    const digits = compact.replace(/^\+/, '');

    if (digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS) {
      return { value: compact, start: match.index, end: match.index + raw.length };
    }
  }

  return null;
}

/** Blanks out the phone number so the remaining text can be tokenized freely. */
export function stripPhoneNumber(input: string, match: PhoneMatch | null): string {
  if (!match) {
    return input;
  }

  return `${input.slice(0, match.start)} ${input.slice(match.end)}`;
}
