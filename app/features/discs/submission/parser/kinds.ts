/**
 * Kept apart from dictionary.ts so that `aliases.ts` can name a kind without
 * importing the dictionary that, in turn, imports the aliases.
 */
export const DISC_NAME = 'discName';
export const PLASTIC = 'plastic';
export const COLOUR = 'colour';
export const MANUFACTURER = 'manufacturer';
/** "Tuntematon" -- the admin saying they could not identify the mould. */
export const UNKNOWN_MARKER = 'unknownMarker';
/** "kiekko", "draiveri", "midari", "putteri". */
export const DISC_TYPE = 'discType';

export type EntryKind =
  | typeof DISC_NAME
  | typeof PLASTIC
  | typeof COLOUR
  | typeof MANUFACTURER
  | typeof UNKNOWN_MARKER
  | typeof DISC_TYPE;

export type DictionaryEntry = {
  kind: EntryKind;
  /** The canonical spelling, used for output. */
  value: string;
  /** Null for colours, which say nothing about who made the disc.
   *  A manufacturer entry names itself. */
  manufacturer: string | null;
};
