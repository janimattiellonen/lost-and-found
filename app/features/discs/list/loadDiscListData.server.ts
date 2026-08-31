import { getDiscs } from '~/models/discs.server';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { isUserLoggedIn } from '~/models/utils';
import { getDistinctCourses, getDistinctDiscNames } from '~/utils';

/** Everything the public disc list renders, for the club this instance serves. */
export async function loadDiscListData(request: Request) {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);

  // The external id is only needed for the admin actions in the table, and the
  // notes in additional_info are club-internal, so both are kept out of the
  // payload anonymous visitors receive. Checked before the query, so the notes
  // are never even read for an anonymous visitor.
  const isLoggedIn = await isUserLoggedIn(request);

  const discs = await getDiscs(isLoggedIn);
  const data = isLoggedIn ? discs : discs.map((disc) => ({ ...disc, externalId: undefined }));

  return {
    clubId,
    data,
    distinctDiscNames: getDistinctDiscNames(data),
    distinctCourses: getDistinctCourses(data),
    emptyingLogItems,
  };
}
