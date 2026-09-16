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
//
// The entry pattern is deliberately loose about quote style, indentation and
// the trailing comma, and every line inside the block that is not a comment or
// blank must match it. A silently skipped line is the one failure these tests
// could not survive: if a reformat made an entry unreadable in both files, the
// comparisons below would pass while comparing nothing. So an unreadable line
// is an error, not something to ignore.
const ENTRY = /^\s*([A-Za-z][A-Za-z0-9]*):\s*(?:'([^']+)'|"([^"]+)"),?\s*$/;

function parsePalette(source: string, file: string): Record<string, string> {
  const start = source.search(/\bpalette\b[^\n]*\{/);
  if (start === -1) throw new Error(`No palette object found in ${file}`);
  const end = source.indexOf('\n}', start);
  if (end === -1) throw new Error(`Palette object in ${file} is never closed at column 0`);

  const entries: Record<string, string> = {};
  const body = source.slice(source.indexOf('{', start) + 1, end);
  for (const line of body.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('//')) continue;
    const match = ENTRY.exec(line);
    if (!match) throw new Error(`Cannot read palette entry in ${file}: ${line.trim()}`);
    entries[match[1]] = match[2] ?? match[3];
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

// The second thing that can drift is Layer 3's promise: that every Tailwind
// alias in `tailwind.config.ts` names the same colour as the StyleX token it is
// the class-name spelling of. The palette comparison above does not see this —
// an alias pointing at the wrong palette entry uses a value both files agree on.
//
// The correspondence between the two spellings is not mechanical for the
// `color` group (`accentSurface` is `surface.accent`, reversed), so it is
// written out below. For `dark` and `icon` it is exactly kebab-case to
// camelCase, so those are derived rather than listed. The table is checked for
// completeness in both directions, which is what stops a new alias being added
// without a token, or the table quietly falling behind either file.
const COLOR_ALIASES: Record<string, string> = {
  'fg.primary': 'textPrimary',
  'fg.secondary': 'textSecondary',
  'fg.body': 'textBody',
  'fg.muted': 'textMuted',
  'fg.subtle': 'textSubtle',
  'fg.strong': 'textStrong',
  'fg.on-accent': 'onAccent',
  'fg.link': 'link',
  'fg.danger': 'dangerText',
  'fg.success': 'successText',
  'surface.DEFAULT': 'surface',
  'surface.muted': 'surfaceMuted',
  'surface.accent': 'accentSurface',
  'surface.accent-hover': 'accentSurfaceHover',
  'surface.accent-selected': 'accentSurfaceSelected',
  'surface.danger': 'dangerSurface',
  'surface.danger-hover': 'dangerSurfaceHover',
  'surface.success': 'successSurface',
  'line.DEFAULT': 'border',
  'line.subtle': 'borderSubtle',
  'line.accent': 'accent',
  'line.accent-subtle': 'accentBorderSubtle',
  'line.accent-translucent': 'accentBorderTranslucent',
  'line.danger': 'dangerBorder',
  'line.danger-translucent': 'dangerBorderTranslucent',
  'line.success': 'successBorder',
  'accent.DEFAULT': 'accent',
  'accent.hover': 'accentHover',
  'danger.DEFAULT': 'danger',
  'danger.hover': 'dangerHover',
  'danger.strong': 'dangerStrong',
  'success.DEFAULT': 'success',
  'success.hover': 'successHover',
  warning: 'warning',
  caution: 'caution',
};

// Read `name: palette.entry` pairs out of one `stylex.defineVars({…})` group in
// `tokens.stylex.ts`. Same rule as `parsePalette`: an unreadable line inside the
// group is an error, so a reformat cannot make this comparison vacuous.
const TOKEN_ENTRY = /^\s*([A-Za-z][A-Za-z0-9]*):\s*palette\.([A-Za-z0-9]+),?\s*$/;

function parseTokenGroup(source: string, group: string): Record<string, string> {
  const start = source.search(new RegExp(`export const ${group} = stylex\\.defineVars\\(\\{`));
  if (start === -1) throw new Error(`No '${group}' group found in tokens.stylex.ts`);
  const end = source.indexOf('\n});', start);
  if (end === -1) throw new Error(`The '${group}' group in tokens.stylex.ts is never closed`);

  const entries: Record<string, string> = {};
  for (const line of source.slice(source.indexOf('{', start) + 1, end).split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('//')) continue;
    const match = TOKEN_ENTRY.exec(line);
    if (!match) throw new Error(`Cannot read token in '${group}': ${line.trim()}`);
    entries[match[1]] = match[2];
  }
  return entries;
}

// Read `theme.extend.colors` as `group.name` (or a bare `name` at the top of it)
// against the palette entry each one points at, by walking the braces rather
// than trusting indentation.
function parseTailwindAliases(source: string): Record<string, string> {
  const start = source.search(/colors:\s*\{/);
  if (start === -1) throw new Error('No colors object found in tailwind.config.ts');

  const aliases: Record<string, string> = {};
  let depth = 0;
  let group: string | null = null;
  for (const line of source.slice(source.indexOf('{', start) + 1).split('\n')) {
    const text = line.trim();
    if (text === '' || text.startsWith('//')) continue;
    if (text === '},' || text === '}') {
      if (depth === 0) break;
      depth -= 1;
      group = null;
      continue;
    }
    const opening = /^'?([A-Za-z][A-Za-z0-9-]*)'?:\s*\{$/.exec(text);
    if (opening) {
      if (depth > 0) throw new Error(`Unexpected nesting under '${group}' in tailwind.config.ts`);
      depth += 1;
      group = opening[1];
      continue;
    }
    const entry = /^'?([A-Za-z][A-Za-z0-9-]*)'?:\s*palette\.([A-Za-z0-9]+),$/.exec(text);
    if (!entry) throw new Error(`Cannot read alias in tailwind.config.ts: ${text}`);
    aliases[group === null ? entry[1] : `${group}.${entry[1]}`] = entry[2];
  }
  return aliases;
}

const tokensSource = readFileSync(path.join(repoRoot, 'app/styles/tokens.stylex.ts'), 'utf8');
const tailwindSource = readFileSync(path.join(repoRoot, 'tailwind.config.ts'), 'utf8');

const tokens = {
  color: parseTokenGroup(tokensSource, 'color'),
  dark: parseTokenGroup(tokensSource, 'dark'),
  icon: parseTokenGroup(tokensSource, 'icon'),
};
const aliases = parseTailwindAliases(tailwindSource);

// `dark-cell-hover` is `dark.cellHover`; the other two groups need no table.
function camelCase(name: string): string {
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function tokenFor(alias: string): { group: keyof typeof tokens; name: string } {
  if (alias.startsWith('dark.')) return { group: 'dark', name: camelCase(alias.slice('dark.'.length)) };
  if (alias.startsWith('icon.')) return { group: 'icon', name: camelCase(alias.slice('icon.'.length)) };
  const name = COLOR_ALIASES[alias];
  if (name === undefined) throw new Error(`Tailwind alias '${alias}' is in no token group`);
  return { group: 'color', name };
}

describe('the Tailwind aliases', () => {
  it('names a token that exists, and the same palette entry it holds', () => {
    const wrong: string[] = [];
    for (const [alias, paletteEntry] of Object.entries(aliases)) {
      const { group, name } = tokenFor(alias);
      const token = tokens[group][name];
      if (token === undefined) wrong.push(`${alias} -> ${group}.${name} (no such token)`);
      else if (token !== paletteEntry) wrong.push(`${alias} is ${paletteEntry}, ${group}.${name} is ${token}`);
    }
    expect(wrong).toEqual([]);
  });

  it('covers every colour token, so a token cannot be left without a class name', () => {
    const named = new Set(Object.keys(aliases).map((alias) => `${tokenFor(alias).group}.${tokenFor(alias).name}`));
    const missing = Object.entries(tokens).flatMap(([group, entries]) =>
      Object.keys(entries)
        .map((name) => `${group}.${name}`)
        .filter((token) => !named.has(token)),
    );
    expect(missing).toEqual([]);
  });

  it('has no entry in the table for a Tailwind alias that no longer exists', () => {
    const present = new Set(Object.keys(aliases));
    expect(Object.keys(COLOR_ALIASES).filter((alias) => !present.has(alias))).toEqual([]);
  });
});
