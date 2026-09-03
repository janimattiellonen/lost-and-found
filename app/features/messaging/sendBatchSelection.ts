import { isExternalId } from '~/lib/api/validate';

/**
 * How many discs one batch may carry.
 *
 * The selection travels in the query string, so it is bounded by what a URL
 * can hold: a hundred ids is some four kilobytes, and well above a realistic
 * selection — a bin emptying yields tens of discs, not hundreds. A larger
 * selection is refused rather than quietly cut short.
 */
export const MAX_BATCH_SIZE = 100;

/**
 * The external ids in an `ids` query value: valid uuids only, deduplicated,
 * still in the order they were given.
 *
 * Order is the order the admin saw in the list, so the batch works through the
 * discs the way they are on screen. Anything that is not a uuid is dropped
 * here rather than sent to the database; since external_id is a NOT NULL uuid
 * column, that only ever discards a hand-edited URL.
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
