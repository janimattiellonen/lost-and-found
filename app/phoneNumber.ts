/**
 * The one rule for an owner's phone number: how a typed one is stored, how a
 * stored one is shown, and how one is searched for. See
 * specs/16-phone-number-format.md.
 *
 * `discs.owner_phone_number` holds one of three things, and a check constraint
 * in the database holds it to them:
 *
 * - NULL, for no number;
 * - E.164 — a "+", the country code and the rest, digits only: "+358501112222";
 * - exactly four digits, the anonymised tail the admin keeps once a disc has
 *   been returned, sold or donated: "2222".
 *
 * Here at the top level of app/ because two slices (discs and messaging), the
 * shared ContactLine, the sheet import and two maintenance scripts read it, and
 * no one of them owns it. It imports nothing: the scripts run on plain node, which cannot
 * resolve the `~/` alias, so nothing in their import graph may use it.
 */

/** What every refused number is told. The shape is what the admin needs. */
export const PHONE_NUMBER_FORMAT_ERROR = 'Anna puhelinnumero muodossa 050 123 4567 tai +46 70 123 4567.';

/** The anonymised form: the last four digits and nothing else. */
const ANONYMISED_LENGTH = 4;
const ANONYMISED = new RegExp(`^\\d{${ANONYMISED_LENGTH}}$`);

/**
 * E.164: at most 15 digits, and a country code never starts with 0. Seven is
 * the floor the submission parser has always used for a number.
 */
const E164 = /^\+[1-9]\d{6,14}$/;

/**
 * The same floor for a Finnish number: seven digits as typed domestically,
 * which is six once its 0 has given way to +358.
 */
const MIN_FINNISH_NATIONAL_DIGITS = 6;

const FINNISH_COUNTRY_CODE = '358';

/** Either the number ready to store — null for none — or why it was refused. */
export type NormalisedPhoneNumber =
  | { phoneNumber: string | null; error?: undefined }
  | { phoneNumber?: undefined; error: string };

/**
 * Reads a typed number into the stored form.
 *
 * Spaces and dashes may be typed anywhere. A leading 00 is the international
 * dialling prefix, and a leading 0 is taken as Finnish — which is wrong for a
 * Swedish 070 number written the Swedish way, and nothing here can tell.
 * Anything else, a "?" or a bracket included, is refused rather than guessed
 * at: a guessed number is how a text reaches the wrong person.
 */
export function normalisePhoneNumber(value: string): NormalisedPhoneNumber {
  const entered = value.trim();

  if (entered.length === 0) {
    return { phoneNumber: null };
  }

  // Before everything else, so "0123" is a tail and not a Finnish number with
  // most of its digits missing.
  if (ANONYMISED.test(entered)) {
    return { phoneNumber: entered };
  }

  let compact = entered.replace(/[\s-]/g, '');

  if (!/^\+?\d+$/.test(compact)) {
    return { error: PHONE_NUMBER_FORMAT_ERROR };
  }

  if (compact.startsWith('00')) {
    compact = `+${compact.slice(2)}`;
  } else if (compact.startsWith('0')) {
    compact = `+${FINNISH_COUNTRY_CODE}${compact.slice(1)}`;
  } else if (!compact.startsWith('+')) {
    // A fragment, or a number missing its country code: not one to guess.
    return { error: PHONE_NUMBER_FORMAT_ERROR };
  }

  // "+358 050 ..." is a common slip; a Finnish number has no 0 after the code.
  if (compact.startsWith(`+${FINNISH_COUNTRY_CODE}0`)) {
    compact = `+${FINNISH_COUNTRY_CODE}${compact.slice(FINNISH_COUNTRY_CODE.length + 2)}`;
  }

  // Counted on the national part, or "050 111" would pass as the eight digits
  // of "+35850111" — whether it was typed with a 0 or after +358.
  const isShortFinnish =
    compact.startsWith(`+${FINNISH_COUNTRY_CODE}`) &&
    compact.length - FINNISH_COUNTRY_CODE.length - 1 < MIN_FINNISH_NATIONAL_DIGITS;

  return E164.test(compact) && !isShortFinnish ? { phoneNumber: compact } : { error: PHONE_NUMBER_FORMAT_ERROR };
}

/**
 * A stored number as it is read on screen.
 *
 * A Finnish number goes back to the domestic form an owner knows it by,
 * "050 111 2222"; a foreign one keeps its country code, "+46 701 112 222". The
 * anonymised tail is shown as "****2222", the way the public list shows every
 * number, so it does not pass for a whole one.
 *
 * Anything in none of the stored forms — only possible before the cleanup
 * script has run — is shown exactly as stored rather than regrouped on a guess.
 */
export function formatPhoneNumber(value?: string | null): string {
  if (!value) {
    return '';
  }

  if (ANONYMISED.test(value)) {
    return `****${value}`;
  }

  if (!E164.test(value)) {
    return value;
  }

  const digits = value.slice(1);

  if (digits.startsWith(FINNISH_COUNTRY_CODE)) {
    return groupDomestic(`0${digits.slice(FINNISH_COUNTRY_CODE.length)}`);
  }

  const codeLength = countryCodeLength(digits);

  return `+${digits.slice(0, codeLength)} ${groupInThrees(digits.slice(codeLength))}`;
}

/**
 * What a phone field opens with: the number as it is shown, so the admin edits
 * what they read — except the anonymised tail, which opens as its four digits,
 * because "****2222" would not save.
 */
export function toEditablePhoneNumber(value?: string | null): string {
  if (value && ANONYMISED.test(value)) {
    return value;
  }

  return formatPhoneNumber(value);
}

/**
 * The digits a typed search should find at the end of a stored number.
 *
 * Read like a typed number, minus the country code: "050 111 2222" becomes
 * "501112222", which a stored "+358501112222" ends with. Four digits or fewer
 * are a tail and kept whole, so "0123" still means the number ending 0123.
 */
export function phoneSearchDigits(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (value.trim().startsWith('+') || digits.length <= ANONYMISED_LENGTH) {
    return digits;
  }

  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  return digits.startsWith('0') ? digits.slice(1) : digits;
}

/**
 * Whether a stored number ends with what was searched for.
 *
 * Works on the four digits an anonymous visitor receives just as on a whole
 * number, so the public list needs no second rule.
 */
export function phoneNumberEndsWith(stored: string | null | undefined, search: string): boolean {
  const searched = phoneSearchDigits(search);

  return searched.length > 0 && (stored ?? '').replace(/\D/g, '').endsWith(searched);
}

/** The operator prefix a Finnish number is grouped after: the 0 and two digits. */
const PHONE_PREFIX_LENGTH = 3;

/** The trailing group. Four digits, so the tail reads as one block. */
const PHONE_LAST_GROUP_LENGTH = 4;

/**
 * A domestic number grouped as prefix, middle, last four: "050 111 2222".
 *
 * Ten digits is the usual length and eleven a real one too (the 0457 numbers),
 * so both are grouped. Any other length is left whole, because every grouping
 * of it would be an invention.
 */
function groupDomestic(domestic: string): string {
  if (domestic.length !== 10 && domestic.length !== 11) {
    return domestic;
  }

  const rest = domestic.slice(PHONE_PREFIX_LENGTH);
  const middle = rest.slice(0, rest.length - PHONE_LAST_GROUP_LENGTH);
  const last = rest.slice(-PHONE_LAST_GROUP_LENGTH);

  return `${domestic.slice(0, PHONE_PREFIX_LENGTH)} ${middle} ${last}`;
}

/**
 * Groups of three from the left, a lone last digit joining the group before
 * it. A readable default for a foreign number, not that country's own style.
 */
function groupInThrees(digits: string): string {
  const groups = digits.match(/\d{1,3}/g) ?? [];

  if (groups.length > 1 && groups[groups.length - 1].length === 1) {
    groups[groups.length - 2] += groups.pop();
  }

  return groups.join(' ');
}

/**
 * The two-digit country codes. E.164 codes are prefix-free — none is the start
 * of another — so with the one-digit codes 1 and 7 this list is enough to say
 * where any code ends: every other code is three digits.
 */
const TWO_DIGIT_COUNTRY_CODES = new Set(
  [
    '20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58',
    '60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98',
  ]
    .join(' ')
    .split(' '),
);

function countryCodeLength(digits: string): number {
  if (digits.startsWith('1') || digits.startsWith('7')) {
    return 1;
  }

  return TWO_DIGIT_COUNTRY_CODES.has(digits.slice(0, 2)) ? 2 : 3;
}
