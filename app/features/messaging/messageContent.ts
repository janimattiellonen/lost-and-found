import { getCourseGenitive } from '~/config/courses';
import { ownerLinkUrl } from '~/lib/ownerLinkUrl';
import type { DiscDTO } from '~/types';

/**
 * A message as the `body` of an `sms:` link.
 *
 * Every character that means something in a url has to be escaped, not just the
 * newlines this used to replace by hand. A template ending "Milloin pääsisit
 * noutamaan kiekon?" put a literal `?` in the link, which starts a url's query
 * string: the messaging app took everything before it as the body and dropped
 * the rest of the message, silently. `&` would have split it the same way, and
 * `#` would have cut it too.
 *
 * `encodeURIComponent` covers all of them, newlines included — it writes `\n`
 * as `%0A`, which is what the hand-rolled version was producing for that one
 * case.
 */
export function toSmsBody(value: string): string {
  return encodeURIComponent(value);
}

export function lineBreakToBr(value: string): string {
  return value.replaceAll('\n', '<br/>');
}

/** The disc fields a template can substitute in. */
type Substitutable = Pick<DiscDTO, 'discColour' | 'discName' | 'course' | 'ownerLinkToken'>;

/**
 * Fills a message template's tokens in.
 *
 * `[link]` is the owner's own page: it lets them answer whether they want the
 * disc back, instead of the club reading a reply and writing it down. It needs
 * an absolute url, so the base comes from the request the page was loaded with
 * — window.location would differ between the server render and the browser's.
 *
 * `[course]` is the course as the disc records it, `[courses]` the same name in
 * the genitive -- "on löytynyt [courses] radalta", the template supplying the
 * "radalta" itself. Finnish inflects place names and nothing here can derive
 * that, so the genitive is configured per course; see getCourseGenitive.
 *
 * replaceAll rather than replace: a template naming the same token twice used
 * to fill the first one in and send the other as literal `[disc]`.
 */
export function replaceTokensWithValues(message: string, disc: Substitutable, baseUrl = ''): string {
  return message
    .replaceAll('[colour]', disc.discColour ? disc.discColour : '')
    .replaceAll('[disc]', disc.discName ? disc.discName : '')
    .replaceAll('[courses]', getCourseGenitive(disc.course))
    .replaceAll('[course]', disc.course ? disc.course : '')
    .replaceAll('[link]', ownerLinkUrl(baseUrl, disc.ownerLinkToken));
}
