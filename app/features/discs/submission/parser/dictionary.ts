import { aliases } from './aliases';
import type { DictionaryEntry, EntryKind } from './kinds';
import { COLOUR, DISC_NAME, DISC_TYPE, MANUFACTURER, PLASTIC, UNKNOWN_MARKER } from './kinds';
import { discColors } from './discColors';
import { vocabulary } from './vocabulary';
import { normalize } from './normalize';

export type { DictionaryEntry, EntryKind };
export { COLOUR, DISC_NAME, DISC_TYPE, MANUFACTURER, PLASTIC, UNKNOWN_MARKER };

export type Dictionary = {
  entries: Map<string, DictionaryEntry[]>;
  manufacturers: string[];
  /** Token count of the longest entry, i.e. the scanner's n-gram window. */
  maxTokens: number;
};

type ManufacturerData = {
  manufacturer: string;
  plastics?: string[];
  discNames?: string[];
};

// Eager glob so the data is bundled rather than read from disk at runtime; a
// new manufacturer file is picked up without touching this module.
const dataModules = import.meta.glob<{ default: ManufacturerData }>('./data/*.json', { eager: true });

function add(entries: Map<string, DictionaryEntry[]>, entry: DictionaryEntry): void {
  const key = normalize(entry.value);

  if (key.length === 0) {
    return;
  }

  const existing = entries.get(key);

  if (!existing) {
    entries.set(key, [entry]);
    return;
  }

  // The same disc or plastic can legitimately appear under several
  // manufacturers ("Wave" is both a DGA and an MVP disc); keep them all so the
  // parser can report the ambiguity instead of guessing silently.
  const isDuplicate = existing.some(
    (candidate) => candidate.kind === entry.kind && candidate.manufacturer === entry.manufacturer,
  );

  if (!isDuplicate) {
    existing.push(entry);
  }
}

export function buildDictionary(extraEntries: DictionaryEntry[] = aliases): Dictionary {
  const entries = new Map<string, DictionaryEntry[]>();
  const manufacturers: string[] = [];

  for (const module of Object.values(dataModules)) {
    const data = module.default;

    manufacturers.push(data.manufacturer);

    // Indexed so that typing the maker explicitly is recognised instead of
    // surviving as a leftover word and being claimed as the owner's name.
    add(entries, { kind: MANUFACTURER, value: data.manufacturer, manufacturer: data.manufacturer });

    for (const value of data.discNames ?? []) {
      add(entries, { kind: DISC_NAME, value, manufacturer: data.manufacturer });
    }

    for (const value of data.plastics ?? []) {
      add(entries, { kind: PLASTIC, value, manufacturer: data.manufacturer });
    }
  }

  for (const value of discColors) {
    add(entries, { kind: COLOUR, value, manufacturer: null });
  }

  for (const entry of vocabulary) {
    add(entries, entry);
  }

  for (const entry of extraEntries) {
    add(entries, entry);
  }

  let maxTokens = 1;

  for (const key of entries.keys()) {
    maxTokens = Math.max(maxTokens, key.split(' ').length);
  }

  manufacturers.sort();

  return { entries, manufacturers, maxTokens };
}

export function lookup(dictionary: Dictionary, term: string): DictionaryEntry[] {
  return dictionary.entries.get(normalize(term)) ?? [];
}
