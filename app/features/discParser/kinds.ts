/**
 * Kept apart from dictionary.ts so that `aliases.ts` can name a kind without
 * importing the dictionary that, in turn, imports the aliases.
 */
export const DISC_NAME = 'discName';
export const PLASTIC = 'plastic';
export const COLOUR = 'colour';
export const MANUFACTURER = 'manufacturer';

export type EntryKind = typeof DISC_NAME | typeof PLASTIC | typeof COLOUR | typeof MANUFACTURER;

export type DictionaryEntry = {
  kind: EntryKind;
  /** The canonical spelling, used for output. */
  value: string;
  /** Null for colours, which say nothing about who made the disc.
   *  A manufacturer entry names itself. */
  manufacturer: string | null;
};
