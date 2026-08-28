/**
 * Folds a phrase into the form used as a dictionary key.
 *
 * Commas, full stops and the degree sign are dropped, so that a colour stored
 * as "Keltainen, musta halo" is found whether or not the admin types the comma,
 * and "Latitude 64°" is found when typed as "Latitude 64". Hyphens and digits
 * are kept: they carry meaning in names like "S-Line" and "DD3".
 */
export function normalize(value: string): string {
  return value.toLowerCase().replace(/[,.°]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Splits raw admin input into tokens, keeping each token's original spelling. */
export function tokenize(value: string): string[] {
  return value.split(/\s+/).filter((token) => token.length > 0);
}
