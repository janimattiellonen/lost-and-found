import { isIsoDate } from '~/lib/api/validate';
import { markAsEmptied } from '~/models/emptyingLog.server';

/**
 * Records that the bin named by the posted form was emptied. An optional
 * `emptiedAt` date overrides the current time — the admin ticked "pvm" on that
 * course's row and picked the day the bin was actually checked.
 */
export async function markBinEmptied(request: Request, body: FormData) {
  const item = body.get('item');

  if (item) {
    const emptiedAt = body.get('emptiedAt')?.toString();

    await markAsEmptied(request, {
      courseId: parseInt(item.toString(), 10),
      emptiedAt: isIsoDate(emptiedAt) ? emptiedAt : undefined,
    });
  }

  return {};
}
