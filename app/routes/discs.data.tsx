import type { LoaderFunctionArgs } from 'react-router';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { getDiscs } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';
import { getDistinctDiscNames } from '~/routes/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);
  const discs = await getDiscs();

  // The external id is only needed for the admin actions in the table, so it is
  // kept out of the payload anonymous visitors receive.
  const isLoggedIn = await isUserLoggedIn(request);
  const data = isLoggedIn ? discs : discs.map((disc) => ({ ...disc, externalId: undefined }));

  const distinctDiscNames = getDistinctDiscNames(data);

  return { clubId: clubId, data, distinctDiscNames, emptyingLogItems };
};
export default function DiscsData() {
  return null;
}
