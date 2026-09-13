import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// The design system's palette is written twice — once as StyleX variables in
// `palette.stylex.ts`, once as plain values in `tailwind.config.ts` — because
// neither tool can read the other's copy. StyleX hashes the CSS variable names
// it emits, so Tailwind cannot reference them; and StyleX rejects imported
// constants inside `defineVars` ("Only static values are allowed inside of a
// defineVars() call"), so the two cannot share one module. These tests are what
// stops the copies drifting apart.
//
// They read both files as source text rather than importing them. Importing
// `palette.stylex.ts` here would yield `var(--x1jb24h0)` and not `#6b7280`,
// because the StyleX compiler has already replaced the values by the time a
// module is loaded — and the Vitest config deliberately runs without the StyleX
// transform at all.
//
// See specs/15-design-system-tokens.md.
const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

// Both files declare the palette as one object literal whose entries are
// `name: 'value',`. Slice out exactly that object — from the `palette` binding
// to the first line that closes it at column 0 — and read the entries from it.
// Anything outside the block (Tailwind's `theme`, StyleX's other groups) must
// not be parsed, or an unrelated quoted value would be read as a colour.
function parsePalette(source: string, file: string): Record<string, string> {
  const start = source.search(/\bpalette\b[^\n]*\{/);
  if (start === -1) throw new Error(`No palette object found in ${file}`);
  const end = source.indexOf('\n}', start);
  if (end === -1) throw new Error(`Palette object in ${file} is never closed at column 0`);

  const entries: Record<string, string> = {};
  for (const [, name, value] of source.slice(start, end).matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):\s*'([^']+)',$/gm)) {
    entries[name] = value;
  }
  if (Object.keys(entries).length === 0) throw new Error(`Parsed no palette entries from ${file}`);
  return entries;
}

function read(file: string): Record<string, string> {
  return parsePalette(readFileSync(path.join(repoRoot, file), 'utf8'), file);
}

const stylexPalette = read('app/styles/palette.stylex.ts');
const tailwindPalette = read('tailwind.config.ts');

describe('the design system palette', () => {
  it('is not empty in either file, so a parsing change cannot make these tests vacuous', () => {
    expect(Object.keys(stylexPalette).length).toBeGreaterThan(30);
    expect(Object.keys(tailwindPalette).length).toBeGreaterThan(30);
  });

  it('defines the same names in palette.stylex.ts and tailwind.config.ts', () => {
    expect(Object.keys(tailwindPalette).sort()).toEqual(Object.keys(stylexPalette).sort());
  });

  it('gives every name the same value in both files', () => {
    expect(tailwindPalette).toEqual(stylexPalette);
  });
});
