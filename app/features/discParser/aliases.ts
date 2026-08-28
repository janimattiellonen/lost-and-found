import type { DictionaryEntry } from './kinds';
import { PLASTIC } from './kinds';

/**
 * Hand-maintained additions for spellings the vendored manufacturer data does
 * not carry. Add to this list rather than editing `data/*.json`, so the data
 * files stay a straight copy of their upstream source.
 */
export const aliases: DictionaryEntry[] = [
  // Kastaplast's data lists "K1", "K1 Glow" and "K1 Soft" but not the plain
  // "K1 Line" wording that is common in Finnish disc listings.
  { kind: PLASTIC, value: 'K1 Line', manufacturer: 'Kastaplast' },
];
