import { isExternalId } from '~/lib/api/validate';

/**
 * The URL contract between the disc list and the batch send page.
 *
 * The selection travels in the query string rather than in memory, so the page
 * survives a reload and can be opened in a second tab. Both sides read this
 * module, so the encoding cannot drift apart: the list is a disc feature and
 * the send page a messaging one, and neither may import the other.
 */
export const SEND_BATCH_PATH = '/message/send-batch';

/**
 * How many discs one batch may carry.
 *
 * Well above a realistic selection — a bin emptying yields tens of discs, not
 * hundreds — and low enough to keep the query string and the `in` clause
 * behind it sane. A larger selection is refused rather than quietly cut short.
 */
export const MAX_BATCH_SIZE = 100;

/** The link the list's "send to the selected owners" action points at. */
export function buildSendBatchHref(externalIds: string[]): string {
  return `${SEND_BATCH_PATH}?ids=${externalIds.join(',')}`;
}

/**
 * The external ids in an `ids` query value: valid uuids only, deduplicated,
 * still in the order they were given.
 *
 * Order is the order the admin saw in the list, so the batch works through the
 * discs the way they are on screen. Anything that is not a uuid is dropped
 * here rather than sent to the database.
 */
export function parseBatchIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  const seen = new Set<string>();

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => {
      if (!isExternalId(value) || seen.has(value)) {
        return false;
      }

      seen.add(value);

      return true;
    });
}
