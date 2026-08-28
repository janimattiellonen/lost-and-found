import type { Dictionary, DictionaryEntry, EntryKind } from './dictionary';
import { COLOUR, DISC_NAME, MANUFACTURER, PLASTIC, buildDictionary, lookup } from './dictionary';
import { normalize, tokenize } from './normalize';
import { findPhoneNumber, stripPhoneNumber } from './phoneNumber';

export type Confidence = 'high' | 'medium' | 'low' | 'none';

export type ParsedDisc = {
  discName: string | null;
  plastic: string | null;
  manufacturer: string | null;
  colour: string | null;
  ownerName: string | null;
  phoneNumber: string | null;
  /** Words the parser could not place anywhere. */
  unmatched: string[];
  confidence: { manufacturer: Confidence };
};

type Span = {
  /** Original spellings, so an owner name keeps its capitals and full stops. */
  tokens: string[];
  entries: DictionaryEntry[];
};

const defaultDictionary = buildDictionary();

/**
 * Splits the input into the longest dictionary entries it can find, leaving
 * unrecognised words as single-token spans. Longest-first matching is what lets
 * "Active Premium" beat "Active" and "Keltainen, musta halo" beat "Keltainen".
 */
function segment(tokens: string[], dictionary: Dictionary): Span[] {
  const normalized = tokens.map(normalize);
  const spans: Span[] = [];

  let index = 0;

  while (index < tokens.length) {
    const window = Math.min(dictionary.maxTokens, tokens.length - index);
    let matched = false;

    for (let size = window; size >= 1; size--) {
      const key = normalized
        .slice(index, index + size)
        .join(' ')
        .trim();
      const entries = key.length > 0 ? lookup(dictionary, key) : [];

      if (entries.length > 0) {
        spans.push({ tokens: tokens.slice(index, index + size), entries });
        index += size;
        matched = true;
        break;
      }
    }

    if (!matched) {
      spans.push({ tokens: [tokens[index]], entries: [] });
      index += 1;
    }
  }

  return spans;
}

/** Slots filled by the scan, each holding the entries that claimed it. */
type Slots = Record<EntryKind, DictionaryEntry[] | null>;

function assign(spans: Span[]): { slots: Slots; leftovers: string[] } {
  const slots: Slots = { [DISC_NAME]: null, [PLASTIC]: null, [COLOUR]: null, [MANUFACTURER]: null };
  const leftovers: string[] = [];
  const ambiguous: Span[] = [];

  // First pass: spans that can only mean one thing. Doing these first is what
  // lets "Eclipse Wave" resolve — "Wave" is unambiguously a disc name, so the
  // ambiguous "Eclipse" is left with the plastic slot.
  for (const span of spans) {
    if (span.entries.length === 0) {
      leftovers.push(...span.tokens);
      continue;
    }

    const kinds = new Set(span.entries.map((entry) => entry.kind));

    if (kinds.size > 1) {
      ambiguous.push(span);
      continue;
    }

    const kind = span.entries[0].kind;

    if (slots[kind]) {
      leftovers.push(...span.tokens);
      continue;
    }

    slots[kind] = span.entries;
  }

  // Second pass: a word that is both a disc name and a plastic takes whichever
  // slot is still free, preferring the disc name.
  for (const span of ambiguous) {
    const kind = ([DISC_NAME, PLASTIC, COLOUR, MANUFACTURER] as EntryKind[]).find((candidate) => !slots[candidate]);

    if (!kind) {
      leftovers.push(...span.tokens);
      continue;
    }

    const entries = span.entries.filter((entry) => entry.kind === kind);

    if (entries.length === 0) {
      leftovers.push(...span.tokens);
      continue;
    }

    slots[kind] = entries;
  }

  return { slots, leftovers };
}

function manufacturersOf(entries: DictionaryEntry[] | null): string[] {
  if (!entries) {
    return [];
  }

  return [...new Set(entries.map((entry) => entry.manufacturer).filter((name): name is string => name !== null))];
}

function inferManufacturer(slots: Slots): { manufacturer: string | null; confidence: Confidence } {
  const stated = manufacturersOf(slots[MANUFACTURER]);

  // Naming the maker outright beats anything inferred from the disc or the
  // plastic, including when the three disagree: the admin is looking at the
  // disc, and a mismatch usually means a rebranded or unlisted mould.
  if (stated.length > 0) {
    return { manufacturer: stated[0], confidence: 'high' };
  }

  const fromDisc = manufacturersOf(slots[DISC_NAME]);
  const fromPlastic = manufacturersOf(slots[PLASTIC]);

  if (fromDisc.length > 0 && fromPlastic.length > 0) {
    const agreed = fromDisc.filter((name) => fromPlastic.includes(name));

    if (agreed.length === 1) {
      return { manufacturer: agreed[0], confidence: 'high' };
    }

    if (agreed.length > 1) {
      return { manufacturer: agreed[0], confidence: 'medium' };
    }

    // The disc name and the plastic point at different makers. The disc name is
    // the more specific of the two, so it wins — but say so quietly.
    return { manufacturer: fromDisc[0], confidence: 'low' };
  }

  const single = fromDisc.length > 0 ? fromDisc : fromPlastic;

  if (single.length === 1) {
    return { manufacturer: single[0], confidence: 'medium' };
  }

  if (single.length > 1) {
    return { manufacturer: single[0], confidence: 'low' };
  }

  return { manufacturer: null, confidence: 'none' };
}

/**
 * Leftover words that start with a capital are read as the owner's name; the
 * rest are reported as unmatched. A name typed in lower case is therefore
 * missed rather than guessed at, which keeps unknown colours and typos out of
 * the owner field.
 */
function splitLeftovers(leftovers: string[]): { ownerName: string | null; unmatched: string[] } {
  const nameParts: string[] = [];
  const unmatched: string[] = [];

  for (const token of leftovers) {
    if (/^\p{Lu}/u.test(token)) {
      nameParts.push(token);
    } else {
      unmatched.push(token);
    }
  }

  return { ownerName: nameParts.length > 0 ? nameParts.join(' ') : null, unmatched };
}

function valueOf(entries: DictionaryEntry[] | null): string | null {
  return entries ? entries[0].value : null;
}

export function parseDiscText(input: string, dictionary: Dictionary = defaultDictionary): ParsedDisc {
  const phone = findPhoneNumber(input);
  const tokens = tokenize(stripPhoneNumber(input, phone));

  const { slots, leftovers } = assign(segment(tokens, dictionary));
  const { manufacturer, confidence } = inferManufacturer(slots);
  const { ownerName, unmatched } = splitLeftovers(leftovers);

  return {
    discName: valueOf(slots[DISC_NAME]),
    plastic: valueOf(slots[PLASTIC]),
    manufacturer,
    colour: valueOf(slots[COLOUR]),
    ownerName,
    phoneNumber: phone ? phone.value : null,
    unmatched,
    confidence: { manufacturer: confidence },
  };
}
