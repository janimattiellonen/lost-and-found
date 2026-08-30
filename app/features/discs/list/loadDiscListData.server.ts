import { getDiscs } from '~/models/discs.server';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { isUserLoggedIn } from '~/models/utils';
import { getDistinctDiscNames } from '~/utils';

/** Everything the public disc list renders, for the club this instance serves. */
export async function loadDiscListData(request: Request) {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);
  const discs = await getDiscs();

  // The external id is only needed for the admin actions in the table, so it is
  // kept out of the payload anonymous visitors receive.
  const isLoggedIn = await isUserLoggedIn(request);
  const data = isLoggedIn ? discs : discs.map((disc) => ({ ...disc, externalId: undefined }));

  return { clubId, data, distinctDiscNames: getDistinctDiscNames(data), emptyingLogItems };
}
