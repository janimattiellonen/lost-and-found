

import{getDiscs} from "~/models/discs.server";

import {importDiscData as importTaliDiscData} from "~/import/TalinTallaajatImporter";
import {importDiscData as importPuskasoturitDiscData} from "~/import/PuskaSoturitImporter";

import{createConnection, createSupabaseServerClient} from "~/models/utils";



import{fromDto} from "~/models/DiscMapper";
import {DbDiscType, DiscDTO} from "~/types";


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

/**
 * Removes ALL discs for given club and inserts discs.
 *
 * @param clubId
 */
export async function syncAllDiscs(clubId: number, request: Request) {
  const importDiscData = getImporter(clubId);
  const discs = await importDiscData();

  const supabase = createSupabaseServerClient(request);
  const session = await supabase.auth.getSession();

  console.log(`SUPA SESSION: ${JSON.stringify(session,null,2)}`);

  const { error: error } = await supabase
    .from('discs')
    .delete()
    .eq('club_id', clubId)

  addDiscs(clubId, discs, request);

  console.log(`SYNC DELETE, CLUB ID: ${clubId}`);
  console.log(`SYNC DELETE ERROR: ${JSON.stringify(error,null,2)}`);
}

async function addDiscs(clubId: number, discs: DiscDTO[],request: Request): Promise<void> {
  const supabase = createSupabaseServerClient(request);

  const mappedData = discs.map((item) => {
    const foo = fromDto(item);
    delete foo['id']
    delete foo['created_at']
    delete foo['updated_at']
    return foo
  })


  mappedData.map( async (data: DbDiscType) => {
    console.log(JSON.stringify(data,null,2));

    const { error: error } = await supabase
      .from('discs')
      .insert(data )

    console.log(`DATA (ROW) TO BE SYNCED: ${JSON.stringify(data,null,2)}`);

    console.log(`SYNC ERROR: ${JSON.stringify(error,null,2)}`);

    return data;
  });


}

export async function syncNewDiscs(clubId: number,  request: Request) {
  const importDiscData = getImporter(clubId);
  const discs = await importDiscData();

  const latestInternalDiscId = await getLatestInternalDiscId(clubId);

  if (!latestInternalDiscId) {
    return null
  }

  const newDiscs = discs.filter( (disc: DiscDTO) => disc.internalDiscId > latestInternalDiscId);

  console.info(`New Discs: ${JSON.stringify(newDiscs, null,2)}`);

  addDiscs(clubId, newDiscs, request);
}

export async function getLatestInternalDiscId(clubId: number): Promise<number | null> {
  const supabase = createConnection();

  let { data, error } = await supabase
    .from("discs")
    .select("internal_disc_id")
    .order('internal_disc_id', { ascending: false })
    .limit(1)
    .eq('club_id', clubId)
    .single();

  return data ? data['internal_disc_id'] : null;
}
