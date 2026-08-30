import { importDiscData as importTaliDiscData } from '~/import/TalinTallaajatImporter';
import { importDiscData as importPuskasoturitDiscData } from '~/import/PuskaSoturitImporter';

import { createConnection, createSupabaseServerClient } from '~/models/utils';

import { fromDTO } from '~/models/DiscMapper';
import type { DiscDTO } from '~/types';

export const PUSKASOTURIT: number = 1;
export const TALIN_TALLAAJAT: number = 2;

function getImporter(clubId: number): () => Promise<DiscDTO[]> {
  if (clubId === PUSKASOTURIT) {
    return importPuskasoturitDiscData;
  } else if (clubId === TALIN_TALLAAJAT) {
    return importTaliDiscData;
  }

  throw Error(`Unrecognized club id: ${clubId}`);
}

function spliceIntoChunks(arr: DiscDTO[], chunkSize: number): Array<DiscDTO[]> {
  const res = [];

  const cloned = [...arr];

  while (cloned.length > 0) {
    const chunk = cloned.splice(0, chunkSize);
    res.push(chunk);
  }
  return res;
}

/**
 * Removes all sheet-imported discs for given club and inserts discs.
 *
 * Discs added through the web app are left alone: they have no
 * internal_disc_id and the sheet has no copy of them, so deleting them here
 * would lose them for good.
 *
 * @param clubId
 */
export async function syncAllDiscs(clubId: number, request: Request) {
  const importDiscData = getImporter(clubId);
  const discs = await importDiscData();

  const supabase = createSupabaseServerClient(request);

  await supabase.from('discs').delete().eq('club_id', clubId).not('internal_disc_id', 'is', null);

  addDiscs(clubId, discs, request);

  saveSyncTime(clubId, request);
}

async function addDiscs(clubId: number, discs: DiscDTO[], request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);

  const chunked = spliceIntoChunks(discs, 100);

  chunked.map(async (chunk: DiscDTO[]) => {
    const mappedData = chunk.map((item) => {
      const foo = fromDTO(item);
      delete foo['id'];
      delete foo['created_at'];
      delete foo['updated_at'];
      // Every disc gets its external id here rather than from a column
      // default, so the app does not depend on one being in place.
      foo['external_id'] = crypto.randomUUID();
      return foo;
    });

    await supabase.from('discs').insert(mappedData);
  });
}

export async function syncNewDiscs(clubId: number, request: Request) {
  const importDiscData = getImporter(clubId);
  const discs = await importDiscData();

  const latestInternalDiscId = await getLatestInternalDiscId(clubId);

  if (!latestInternalDiscId) {
    return null;
  }

  const newDiscs = discs.filter(
    (disc: DiscDTO) => disc.internalDiscId !== null && disc.internalDiscId > latestInternalDiscId,
  );

  addDiscs(clubId, newDiscs, request);
}

export async function getLatestInternalDiscId(clubId: number): Promise<number | null> {
  const supabase = createConnection();

  const { data } = await supabase
    .from('discs')
    .select('internal_disc_id')
    // Web-added discs have no row number. Postgres sorts NULLs first on a
    // descending order, so they have to be excluded or they would come back
    // as the "latest" and stall the sync.
    .not('internal_disc_id', 'is', null)
    .order('internal_disc_id', { ascending: false })
    .limit(1)
    .eq('club_id', clubId)
    .single();

  return data ? data['internal_disc_id'] : null;
}

async function saveSyncTime(clubId: number, request: Request) {
  const supabase = createSupabaseServerClient(request);

  await supabase
    .from('sync_log')
    .upsert(
      {
        id: clubId,
        updated_at: 'now()',
        club_id: clubId,
      },
      {
        onConflict: 'club_id',
        ignoreDuplicates: false,
      },
    )
    .select();
}
