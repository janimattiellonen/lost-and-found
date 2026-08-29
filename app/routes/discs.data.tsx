import type { LoaderFunctionArgs } from 'react-router';

import { loadDiscListData } from '~/features/discs/list/loadDiscListData.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDiscListData(request);
};

export default function DiscsDataRoute() {
  return null;
}
