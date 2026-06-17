import type { LoaderFunctionArgs } from 'react-router';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { getDiscs } from '~/models/discs.server';
import { getDistinctDiscNames } from '~/routes/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);
  const data = await getDiscs();

  const distinctDiscNames = getDistinctDiscNames(data);

  return { clubId: clubId, data, distinctDiscNames, emptyingLogItems };
};
export default function DiscsData() {
  return null;
}
