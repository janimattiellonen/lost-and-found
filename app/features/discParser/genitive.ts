import type { Dictionary } from './dictionary';
import { MANUFACTURER } from './kinds';
import { normalize } from './normalize';

// Finnish genitive endings, longest first. Stripping one of these and looking
// the stem up covers 21 of the 23 manufacturers ("Innovan" -> Innova,
// "Kastaplastin" -> Kastaplast, "MVP:n" -> MVP). The irregulars that are left
// ("Prodiscuksen", "Thought Spacen") are listed in aliases.ts instead.
const GENITIVE_SUFFIXES = [':n', 'in', 'n'];

/**
 * Resolves a word or phrase to a manufacturer, in its plain or genitive form.
 * Accepts a phrase because the suffix may attach to either word of a
 * multi-word maker: both "Latituden" and "Latitude 64:n" mean Latitude 64°.
 * Returns null when nothing names a maker.
 */
export function resolveManufacturer(phrase: string, dictionary: Dictionary): string | null {
  const key = normalize(phrase);

  const direct = dictionary.entries.get(key)?.find((entry) => entry.kind === MANUFACTURER);

  if (direct) {
    return direct.manufacturer;
  }

  for (const suffix of GENITIVE_SUFFIXES) {
    if (!key.endsWith(suffix)) {
      continue;
    }

    const stem = key.slice(0, -suffix.length);

    if (stem.length === 0) {
      continue;
    }

    const entry = dictionary.entries.get(stem)?.find((candidate) => candidate.kind === MANUFACTURER);

    if (entry) {
      return entry.manufacturer;
    }

    // "Westsiden" -> "Westside Discs": people inflect the first word only.
    const byFirstWord = dictionary.manufacturers.find((name) => normalize(name).split(' ')[0] === stem);

    if (byFirstWord) {
      return byFirstWord;
    }
  }

  return null;
}
