import { json, LoaderArgs } from '@remix-run/node';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { getDiscs } from '~/models/discs.server';
import { getDistinctDiscNames } from '~/routes/utils';

export const loader = async ({ request }: LoaderArgs) => {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);
  const data = await getDiscs();

  const distinctDiscNames = getDistinctDiscNames(data);

  const res = await fetch('http://localhost:3600/test');
  const fop = await res.json();
  console.log(`fop: ${JSON.stringify(fop, null, 2)}`);

  return json({ clubId: clubId, data, distinctDiscNames, emptyingLogItems });
};
export default function Foo() {
  return <div>ssss</div>;
}
