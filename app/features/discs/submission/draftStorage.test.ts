import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseDiscText } from '~/features/discs/submission/parser/parseDiscText';

import type { DraftRow } from './draftStorage';

const STORAGE_KEY = 'lost-and-found:disc-draft:v1';

/** A localStorage good enough for the store, with the failures it has to survive. */
function stubStorage(initial: Record<string, string> = {}, mode: 'ok' | 'throws' = 'ok') {
  const items = new Map(Object.entries(initial));

  const storage = {
    getItem: (key: string) => {
      if (mode === 'throws') {
        throw new Error('storage blocked');
      }

      return items.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (mode === 'throws') {
        throw new Error('quota exceeded');
      }

      items.set(key, value);
    },
    removeItem: (key: string) => {
      if (mode === 'throws') {
        throw new Error('storage blocked');
      }

      items.delete(key);
    },
  };

  vi.stubGlobal('window', { localStorage: storage });

  return items;
}

/**
 * A fresh copy of the store. Its draft is module state, deliberately, so each
 * test needs its own module instance rather than a reset between them.
 */
async function loadStore() {
  vi.resetModules();

  return import('./draftStorage');
}

const row = (id: number, text: string): DraftRow => ({
  id,
  input: text,
  course: null,
  ...parseDiscText(text),
});

beforeEach(() => {
  stubStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the draft store', () => {
  it('starts empty when storage holds no draft', async () => {
    const store = await loadStore();

    expect(store.getDraftSnapshot()).toEqual([]);
  });

  it('never hands a stored draft to the server render', async () => {
    stubStorage({ [STORAGE_KEY]: JSON.stringify([row(1, 'Mako3 keltainen')]) });

    const store = await loadStore();

    expect(store.getServerDraftSnapshot()).toEqual([]);
  });

  it('keeps rows across a reload', async () => {
    const first = await loadStore();

    first.updateDraft((current) => [...current, row(1, 'Star Destroyer punainen')]);

    // A new module instance is what a refreshed page gets.
    const second = await loadStore();

    expect(second.getDraftSnapshot()).toMatchObject([{ id: 1, discName: 'Destroyer', plastic: 'Star' }]);
  });

  it('returns the same array until something changes, as useSyncExternalStore needs', async () => {
    const store = await loadStore();

    store.updateDraft(() => [row(1, 'Mako3 keltainen')]);

    expect(store.getDraftSnapshot()).toBe(store.getDraftSnapshot());
  });

  it('tells subscribers when the draft changes', async () => {
    const store = await loadStore();
    const listener = vi.fn();

    const unsubscribe = store.subscribeToDraft(listener);
    store.updateDraft(() => [row(1, 'Mako3 keltainen')]);

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.updateDraft(() => []);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clears the draft from storage as well as memory', async () => {
    const items = stubStorage();
    const store = await loadStore();

    store.updateDraft(() => [row(1, 'Mako3 keltainen')]);
    expect(items.has(STORAGE_KEY)).toBe(true);

    store.clearDraft();

    expect(store.getDraftSnapshot()).toEqual([]);
    expect(items.has(STORAGE_KEY)).toBe(false);
  });

  it('leaves no empty draft behind when the last row is removed', async () => {
    const items = stubStorage();
    const store = await loadStore();

    store.updateDraft(() => [row(1, 'Mako3 keltainen')]);
    store.updateDraft((current) => current.filter((entry) => entry.id !== 1));

    expect(items.has(STORAGE_KEY)).toBe(false);
  });

  describe('a draft that cannot be trusted', () => {
    it('ignores one that is not JSON', async () => {
      stubStorage({ [STORAGE_KEY]: 'not json {' });

      expect((await loadStore()).getDraftSnapshot()).toEqual([]);
    });

    it('ignores one that is not an array', async () => {
      stubStorage({ [STORAGE_KEY]: JSON.stringify({ id: 1 }) });

      expect((await loadStore()).getDraftSnapshot()).toEqual([]);
    });

    it('drops the entries that are not rows', async () => {
      stubStorage({ [STORAGE_KEY]: JSON.stringify([null, 'Mako3', row(1, 'Mako3 keltainen')]) });

      expect((await loadStore()).getDraftSnapshot()).toHaveLength(1);
    });

    it('falls back on fields of the wrong type rather than passing them to the table', async () => {
      stubStorage({
        [STORAGE_KEY]: JSON.stringify([{ id: 'first', input: 42, discName: { name: 'Mako3' }, unmatched: 'kaikki' }]),
      });

      expect((await loadStore()).getDraftSnapshot()).toEqual([
        {
          id: 1,
          input: '',
          discName: null,
          plastic: null,
          manufacturer: null,
          colour: null,
          ownerName: null,
          phoneNumber: null,
          additionalInfo: null,
          course: null,
          unmatched: [],
          confidence: { manufacturer: 'none' },
        },
      ]);
    });

    it('rejects a confidence outside the ones the table knows', async () => {
      stubStorage({ [STORAGE_KEY]: JSON.stringify([{ id: 1, confidence: { manufacturer: 'certain' } }]) });

      expect((await loadStore()).getDraftSnapshot()[0].confidence).toEqual({ manufacturer: 'none' });
    });
  });

  describe('a browser that refuses storage', () => {
    it('still starts, with an empty draft', async () => {
      stubStorage({}, 'throws');

      expect((await loadStore()).getDraftSnapshot()).toEqual([]);
    });

    it('still keeps the rows in memory when they cannot be written', async () => {
      stubStorage({}, 'throws');

      const store = await loadStore();

      store.updateDraft(() => [row(1, 'Mako3 keltainen')]);

      expect(store.getDraftSnapshot()).toHaveLength(1);
    });
  });
});

describe('nextDraftId', () => {
  it('starts at 1 on an empty draft', async () => {
    const { nextDraftId } = await loadStore();

    expect(nextDraftId([])).toBe(1);
  });

  it('carries on past the ids a restored draft already uses', async () => {
    const { nextDraftId } = await loadStore();

    expect(nextDraftId([row(3, 'Mako3'), row(7, 'Wave'), row(2, 'Buzzz')])).toBe(8);
  });
});
