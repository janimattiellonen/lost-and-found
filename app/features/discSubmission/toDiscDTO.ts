import type { DiscDTO } from '~/types';

import type { DiscSubmission } from './submitDiscs';

/** The most discs one batch may carry. Guards against a runaway request. */
export const MAX_BATCH_SIZE = 100;

const MAX_FIELD_LENGTH = 200;

/**
 * Joins the disc name and the plastic the way the Google Sheet has always
 * written them: "Destroyer, Star". Existing rows use that shape, so the public
 * list and the disc-name filter keep working on hand-added discs.
 */
export function toDiscName(disc: Pick<DiscSubmission, 'discName' | 'plastic'>): string {
  return [disc.discName, disc.plastic].filter((part) => part != null && part.length > 0).join(', ');
}

/**
 * Maps one submitted row onto the DTO the disc model persists.
 *
 * external_id, internal_disc_id and added_at are deliberately absent: they are
 * the model's to assign.
 */
export function toDiscDTO(disc: DiscSubmission, clubId: number): DiscDTO {
  return {
    internalDiscId: null,
    discName: toDiscName(disc),
    discColour: disc.colour ?? '',
    discManufacturer: disc.manufacturer,
    ownerName: disc.ownerName,
    ownerPhoneNumber: disc.phoneNumber ?? undefined,
    clubId,
  };
}

const fields = ['discName', 'plastic', 'colour', 'manufacturer', 'phoneNumber', 'ownerName'] as const;

function readField(row: Record<string, unknown>, field: string): string | null | undefined {
  const value = row[field];

  if (value == null) {
    return null;
  }

  if (typeof value !== 'string' || value.length > MAX_FIELD_LENGTH) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Validates a batch as it arrives over the wire. The request body is untrusted,
 * so nothing is assumed about its shape.
 *
 * Returns the accepted rows, or a Finnish message ready to show in the error
 * box.
 */
export function parseBatch(body: unknown): { discs: DiscSubmission[] } | { error: string } {
  if (typeof body !== 'object' || body === null || !Array.isArray((body as { discs?: unknown }).discs)) {
    return { error: 'Virheellinen pyyntö.' };
  }

  const rows = (body as { discs: unknown[] }).discs;

  if (rows.length === 0) {
    return { error: 'Ei tallennettavia kiekkoja.' };
  }

  if (rows.length > MAX_BATCH_SIZE) {
    return { error: `Liian monta kiekkoa kerralla (enintään ${MAX_BATCH_SIZE}).` };
  }

  const discs: DiscSubmission[] = [];

  for (const [index, row] of rows.entries()) {
    if (typeof row !== 'object' || row === null) {
      return { error: `Rivi ${index + 1} on virheellinen.` };
    }

    const disc = {} as Record<(typeof fields)[number], string | null>;

    for (const field of fields) {
      const value = readField(row as Record<string, unknown>, field);

      if (value === undefined) {
        return { error: `Rivi ${index + 1}: kenttä "${field}" on virheellinen.` };
      }

      disc[field] = value;
    }

    // disc_name is what the public list is built around, so a nameless row is
    // rejected rather than saved as a blank.
    if (toDiscName(disc).length === 0) {
      return { error: `Rivi ${index + 1}: kiekolla on oltava nimi tai muovi.` };
    }

    discs.push(disc);
  }

  return { discs };
}
