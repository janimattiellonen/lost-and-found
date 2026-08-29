/** Matches the canonical 8-4-4-4-12 uuid form. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isExternalId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/** Matches an ISO calendar date, y-MM-dd. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in ISO form — 2026-02-30 is rejected. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}
