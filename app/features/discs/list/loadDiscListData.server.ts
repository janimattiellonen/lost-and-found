import { currentClubId, isRetrievalListEnabled } from '~/config/clubs';
import { queryPendingRetrievalMethods } from '~/features/discs/retrieval/queryPendingRetrievalMethods.server';
import { getDiscs } from '~/models/discs.server';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';
import { getDistinctCourses, getDistinctDiscNames } from '~/utils';

/** Everything the public disc list renders, for the club this instance serves. */
export async function loadDiscListData(request: Request) {
  const clubId = currentClubId();

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);

  // What an anonymous visitor may receive is narrower on three counts: the
  // external id is only needed for the admin actions in the table, the notes in
  // additional_info are club-internal, and the owner's phone number is cut to
  // its last four digits. Checked before the query, so the notes are never even
  // read for an anonymous visitor.
  const isLoggedIn = await isUserLoggedIn(request);

  const discs = await getDiscs(isLoggedIn);
  const data = isLoggedIn ? discs : discs.map((disc) => ({ ...disc, externalId: undefined }));

  // Which of these discs are already waiting to be fetched from storage, so the
  // row action can say so rather than putting one on the list twice. Null when
  // there is no retrieval list to be on -- another club, or nobody signed in.
  const pendingRetrievals =
    isLoggedIn && isRetrievalListEnabled()
      ? await queryPendingRetrievalMethods(createSupabaseServerClient(request))
      : null;

  return {
    clubId,
    data,
    pendingRetrievals,
    distinctDiscNames: getDistinctDiscNames(data),
    distinctCourses: getDistinctCourses(data),
    emptyingLogItems,
  };
}
