/**
 * Folds a phrase into the form used as a dictionary key.
 *
 * Commas and full stops are dropped so that a colour stored as
 * "Keltainen, musta halo" is found whether or not the admin types the comma.
 * Hyphens, digits and the degree sign are kept: they carry meaning in names
 * like "S-Line", "DD3" and "Latitude 64°".
 */
export function normalize(value: string): string {
  return value.toLowerCase().replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Splits raw admin input into tokens, keeping each token's original spelling. */
export function tokenize(value: string): string[] {
  return value.split(/\s+/).filter((token) => token.length > 0);
}
