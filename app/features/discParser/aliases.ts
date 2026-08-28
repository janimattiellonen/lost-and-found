import type { DictionaryEntry } from './kinds';
import { MANUFACTURER, PLASTIC } from './kinds';

/**
 * Hand-maintained additions for spellings the vendored manufacturer data does
 * not carry. Add to this list rather than editing `data/*.json`, so the data
 * files stay a straight copy of their upstream source.
 */
export const aliases: DictionaryEntry[] = [
  // Kastaplast's data lists "K1", "K1 Glow" and "K1 Soft" but not the plain
  // "K1 Line" wording that is common in Finnish disc listings.
  { kind: PLASTIC, value: 'K1 Line', manufacturer: 'Kastaplast' },

  // Manufacturer spellings people actually type. Short forms are only safe
  // where they do not clash with a disc name -- "Clash", "Mint" and "Viking"
  // are all discs, so those makers are matched by their full name only.
  { kind: MANUFACTURER, value: 'Latitude 64\u00b0', manufacturer: 'Latitude 64\u00b0' },
  { kind: MANUFACTURER, value: 'Axiom', manufacturer: 'Axiom Discs' },
  { kind: MANUFACTURER, value: 'Dynamic', manufacturer: 'Dynamic Discs' },
  { kind: MANUFACTURER, value: 'Infinite', manufacturer: 'Infinite Discs' },
  { kind: MANUFACTURER, value: 'Latitude', manufacturer: 'Latitude 64\u00b0' },
  { kind: MANUFACTURER, value: 'RPM', manufacturer: 'RPM Discs' },
  { kind: MANUFACTURER, value: 'Streamline', manufacturer: 'Streamline Discs' },
  { kind: MANUFACTURER, value: 'Westside', manufacturer: 'Westside Discs' },
  { kind: MANUFACTURER, value: 'Wild', manufacturer: 'Wild Discs' },
];
