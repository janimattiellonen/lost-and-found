/**
 * What posting a disc back to its owner costs, and who the owner pays for it.
 *
 * In one place because it changes on its own schedule -- postage goes up, the
 * admin's number could change -- and none of that is a reason to edit a page
 * component. The club's own voluntary thank-you is separate and per-club; see
 * getClubPayment in ~/config/clubs.
 */

/**
 * The postage the owner pays, in cents.
 *
 * Cents rather than euros so the amount stays exact and formatting stays in
 * one place: written as 6.30 it is a float that no longer reads as money.
 */
export const POSTAGE_FEE_CENTS = 630;

/** Where that payment goes. The admin posts the disc, whichever club owns it. */
export const POSTAGE_PAYEE_NUMBER = '050 464 3904';
export const POSTAGE_PAYEE_NAME = 'Janimatti Ellonen';

/**
 * An amount of cents as an owner reads it in Finnish: 630 becomes "6,30 €".
 *
 * Defaults to the configured fee, and takes an amount so the formatting can be
 * checked without a test that pins whatever the fee happens to be today.
 */
export function formatPostageFee(cents: number = POSTAGE_FEE_CENTS): string {
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
