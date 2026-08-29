import type { DictionaryEntry } from './kinds';
import { DISC_TYPE, UNKNOWN_MARKER } from './kinds';

/**
 * Words that describe a disc the admin could not identify, e.g.
 * "Tuntematon innovan kiekko". They carry no catalogue meaning on their own;
 * the parser only uses them to recognise such a phrase and keep it verbatim.
 */
export const vocabulary: DictionaryEntry[] = [
  { kind: UNKNOWN_MARKER, value: 'Tuntematon', manufacturer: null },

  { kind: DISC_TYPE, value: 'kiekko', manufacturer: null },
  { kind: DISC_TYPE, value: 'draiveri', manufacturer: null },
  { kind: DISC_TYPE, value: 'väylädraiveri', manufacturer: null },
  { kind: DISC_TYPE, value: 'midari', manufacturer: null },
  { kind: DISC_TYPE, value: 'putteri', manufacturer: null },
];
