import { HandoverMethod, isHandoverMethod, type HandoverMethodValue } from '~/features/discs/handoverMethod';
import { isOwnerChoice, OwnerChoice } from './ownerChoice';
import type { OwnerResponse, ShippingAddress } from './ownerResponse';

/** A parsed answer, or the Finnish message to show above the form. */
export type ParseResult = { response: OwnerResponse } | { error: string };

/**
 * Reads an answer off the owner-facing form.
 *
 * Kept apart from the route so the rules can be checked without a request or a
 * database. The messages are what the owner reads, so they say what to do
 * rather than what was wrong with the payload.
 *
 * `allowed` is the handover methods this disc's location permits: collecting
 * from the storage is only offered while the disc is still in it, and a form
 * posting the option anyway is refused here rather than stored and puzzled over
 * later.
 */
export function parseOwnerResponse(form: FormData, allowed: HandoverMethodValue[]): ParseResult {
  const choice = toNumber(form.get('choice'));

  if (!isOwnerChoice(choice)) {
    return { error: 'Valitse, haluatko kiekon takaisin.' };
  }

  if (choice === OwnerChoice.GivesUp) {
    return { response: { choice: OwnerChoice.GivesUp } };
  }

  const handoverMethod = toNumber(form.get('handoverMethod'));

  if (!isHandoverMethod(handoverMethod) || !allowed.includes(handoverMethod)) {
    return { error: 'Valitse, miten haluat kiekon takaisin.' };
  }

  if (handoverMethod !== HandoverMethod.ByMail) {
    return { response: { choice: OwnerChoice.WantsItBack, handoverMethod } };
  }

  // Several discs waiting: the parcel's contents decide the postage, so the
  // club agrees both by message and asks for the address then. Nothing to
  // validate here, which is the point of the checkbox.
  if (form.get('hasMoreDiscs') !== null) {
    return { response: { choice: OwnerChoice.WantsItBack, handoverMethod, hasMoreDiscs: true } };
  }

  const address = readAddress(form);

  if ('error' in address) {
    return address;
  }

  return { response: { choice: OwnerChoice.WantsItBack, handoverMethod, address: address.address } };
}

/** Finnish postal codes are five digits. Anywhere else, anything non-empty. */
const FINNISH_POSTAL_CODE = /^\d{5}$/;

const FINLAND = ['', 'suomi', 'finland', 'fi'];

/**
 * How long each line of an address may be, and what it is called to the owner.
 *
 * These end up on a parcel label, so the limits are what fits on one: generous
 * for a real address, and short enough that the columns behind them cannot be
 * filled with something else. The only credential here is the link, which may
 * have been forwarded to anyone.
 *
 * The same numbers are the fields' maxLength on the page, so an owner is
 * stopped as they type rather than after submitting.
 */
export const ADDRESS_LIMITS = {
  shippingName: { max: 100, label: 'Nimi' },
  shippingStreet: { max: 150, label: 'Katuosoite' },
  shippingPostalCode: { max: 16, label: 'Postinumero' },
  shippingCity: { max: 60, label: 'Postitoimipaikka' },
  shippingCountry: { max: 60, label: 'Maa' },
} as const;

function readAddress(form: FormData): { address: ShippingAddress } | { error: string } {
  const name = text(form.get('shippingName'));
  const street = text(form.get('shippingStreet'));
  const postalCode = text(form.get('shippingPostalCode'));
  const city = text(form.get('shippingCity'));
  const country = text(form.get('shippingCountry'));

  if (!name || !street || !postalCode || !city) {
    return { error: 'Täytä postitusta varten nimi, katuosoite, postinumero ja postitoimipaikka.' };
  }

  const tooLong = firstTooLong({
    shippingName: name,
    shippingStreet: street,
    shippingPostalCode: postalCode,
    shippingCity: city,
    shippingCountry: country,
  });

  if (tooLong) {
    return { error: tooLong };
  }

  // Only checked for Finland: a five-digit rule applied to an address abroad
  // would refuse a correct one.
  if (FINLAND.includes(country.toLowerCase()) && !FINNISH_POSTAL_CODE.test(postalCode)) {
    return { error: 'Tarkista postinumero – suomalainen postinumero on viisi numeroa.' };
  }

  return { address: { name, street, postalCode, city, country } };
}

/**
 * The message for the first line that is over its limit, or null when none is.
 *
 * Named rather than a single "check the address": the owner is looking at five
 * fields and has to know which one to shorten.
 */
function firstTooLong(values: Record<keyof typeof ADDRESS_LIMITS, string>): string | null {
  for (const [field, { max, label }] of Object.entries(ADDRESS_LIMITS)) {
    if (values[field as keyof typeof ADDRESS_LIMITS].length > max) {
      return `${label} on liian pitkä – enintään ${max} merkkiä.`;
    }
  }

  return null;
}

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}
