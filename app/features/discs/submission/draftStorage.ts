import type { Confidence, ParsedDisc } from '~/features/discs/submission/parser/parseDiscText';

/** One row of the add-discs table as it is held between page loads. */
export type DraftRow = ParsedDisc & {
  id: number;
  /** The line as it was typed, kept so a row can be traced back to its input. */
  input: string;
  course: string | null;
};

const STORAGE_KEY = 'lost-and-found:disc-draft:v1';

/**
 * The rows the admin has entered but not yet saved.
 *
 * Held in a module-level store rather than in component state so that the draft
 * outlives an accidental refresh: twenty discs typed in is half an hour of work
 * that used to disappear. localStorage is the durable copy, but this array is
 * the source of truth — a browser that refuses storage (private mode, blocked
 * site data) then still gets a working page, it just loses the draft on
 * refresh.
 *
 * Read through useSyncExternalStore, which is what keeps the restore free of
 * hydration mismatches: the server and the first client render both see the
 * empty server snapshot, and the stored rows arrive on the render after it.
 */
let rows: DraftRow[] = [];

/** Whether localStorage has been read yet. Deferred so it never runs on the server. */
let isLoaded = false;

const listeners = new Set<() => void>();

/** A stable empty array, so the server snapshot keeps its identity between calls. */
const EMPTY: DraftRow[] = [];

const CONFIDENCES: Confidence[] = ['high', 'medium', 'low', 'none'];

function isConfidence(value: unknown): value is Confidence {
  return typeof value === 'string' && (CONFIDENCES as string[]).includes(value);
}

function readString(row: Record<string, unknown>, field: string): string | null {
  const value = row[field];

  return typeof value === 'string' ? value : null;
}

/**
 * Rebuilds one row from whatever was in storage.
 *
 * localStorage is writable by anything running on the origin and survives a
 * deploy that changes the row shape, so nothing about it is assumed: a field of
 * the wrong type falls back rather than reaching the table, where it would
 * crash the render. The server validates the batch again on save regardless.
 */
function toDraftRow(value: unknown, index: number): DraftRow | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const confidence = (row.confidence ?? {}) as Record<string, unknown>;

  return {
    id: typeof row.id === 'number' && Number.isFinite(row.id) ? row.id : index + 1,
    input: typeof row.input === 'string' ? row.input : '',
    discName: readString(row, 'discName'),
    plastic: readString(row, 'plastic'),
    manufacturer: readString(row, 'manufacturer'),
    colour: readString(row, 'colour'),
    ownerName: readString(row, 'ownerName'),
    phoneNumber: readString(row, 'phoneNumber'),
    additionalInfo: readString(row, 'additionalInfo'),
    course: readString(row, 'course'),
    unmatched: Array.isArray(row.unmatched)
      ? row.unmatched.filter((token): token is string => typeof token === 'string')
      : [],
    confidence: { manufacturer: isConfidence(confidence.manufacturer) ? confidence.manufacturer : 'none' },
  };
}

function load(): DraftRow[] {
  let raw: string | null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked outright. Carry on without a draft.
    return EMPTY;
  }

  if (raw == null) {
    return EMPTY;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return EMPTY;
    }

    const restored = parsed.map(toDraftRow).filter((row): row is DraftRow => row !== null);

    return restored.length > 0 ? restored : EMPTY;
  } catch {
    // Not the JSON we wrote. Treat it as no draft rather than throwing on a
    // page the admin is trying to work on.
    return EMPTY;
  }
}

/** Mirrors the draft to storage. Best effort: a full quota must not break the page. */
function persist(): void {
  try {
    if (rows.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }
  } catch {
    // Storage blocked or full; the in-memory draft is unaffected.
  }
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToDraft(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * The current draft, loading it from storage the first time it is asked for.
 *
 * Returns the same array until something changes it, as useSyncExternalStore
 * requires — a fresh array on every call would loop.
 */
export function getDraftSnapshot(): DraftRow[] {
  if (!isLoaded) {
    rows = load();
    isLoaded = true;
  }

  return rows;
}

/** What the server and the hydrating render see: never a stored draft. */
export function getServerDraftSnapshot(): DraftRow[] {
  return EMPTY;
}

/** Applies a change to the draft and mirrors it to storage. */
export function updateDraft(update: (current: DraftRow[]) => DraftRow[]): void {
  rows = update(getDraftSnapshot());
  persist();
  notify();
}

/** Drops the draft, in memory and in storage. */
export function clearDraft(): void {
  rows = EMPTY;
  isLoaded = true;
  persist();
  notify();
}

/** The id to give the next row, past anything a restored draft already uses. */
export function nextDraftId(current: DraftRow[]): number {
  return current.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;
}
