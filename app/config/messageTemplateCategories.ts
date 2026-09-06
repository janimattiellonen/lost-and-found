/**
 * The message template categories that code itself points at.
 *
 * Categories are rows the admin creates and renames at
 * `/message-template-categories`, so most of them are none of the code's
 * business. A page that messages an owner for one particular reason is the
 * exception: it has to name the category whose templates it wants.
 *
 * It names it by row id. Not by name, which the admin may change at any moment,
 * and not by an immutable string key stored beside the name, which would
 * survive the rename but then say `owner-response` about a category the admin
 * has since called something else. The id is the one identifier that is both
 * stable and never shown.
 *
 * A map keyed on the club, like `CONTACT_EMAILS` in `~/config/clubs`: the two
 * clubs share a database and each has its own row for the same idea. The ids
 * below are the ones seeded by
 * `supabase/migrations/20260906000000_message_template_categories.sql`, which
 * inserts them explicitly so these numbers hold in every environment.
 *
 * Server-only, because `currentClubId` reads `APP_CLUB_ID` from the
 * environment. Call it in a loader and send the number to the browser.
 */

import { currentClubId, PUSKASOTURIT, TALIN_TALLAAJAT } from '~/config/clubs';

/** Templates for an owner who has already answered from the link in the sms. */
const OWNER_RESPONSE: Record<number, number> = {
  [PUSKASOTURIT]: 1,
  [TALIN_TALLAAJAT]: 2,
};

/**
 * The category `/responses` narrows its message composer to.
 *
 * Null for a club with no row of its own, so the caller links to the composer
 * without a category rather than with a nonsensical one.
 */
export function ownerResponseCategoryId(): number | null {
  return OWNER_RESPONSE[currentClubId()] ?? null;
}
