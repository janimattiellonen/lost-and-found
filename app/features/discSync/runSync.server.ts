import { syncAllDiscs, syncNewDiscs } from '~/models/syncDiscs.server';

/** Runs the Google Sheet sync the posted form asked for. */
export async function runSync(request: Request, body: FormData) {
  const clubId = parseInt(body.get('clubId')?.toString() ?? '', 10);

  if (body.get('all')) {
    await syncAllDiscs(clubId, request);
  } else if (body.get('new')) {
    await syncNewDiscs(clubId, request);
  }

  return { ok: true };
}
