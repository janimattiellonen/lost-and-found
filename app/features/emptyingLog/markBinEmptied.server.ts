import { markAsEmptied } from '~/models/emptyingLog.server';

/** Records that the bin named by the posted form was emptied. */
export async function markBinEmptied(request: Request, body: FormData) {
  const item = body.get('item');

  if (item) {
    await markAsEmptied(parseInt(item.toString(), 10), request);
  }

  return {};
}
