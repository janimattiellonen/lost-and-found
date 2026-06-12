import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { useLoaderData } from 'react-router';

import { getEmptyingLogItems, markAsEmptied } from '~/models/emptyingLog.server';
import type { EmptyingLogDTO } from '~/types';

import { isUserLoggedIn } from '~/models/utils';

import EmptyingLogItem from '~/routes/components/admin/EmptyingLogItem';

import H2 from '~/routes/components/H2';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const emptyingLogItems = await getEmptyingLogItems(request);

  return { emptyingLogItems };
};

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();

  const item = body.get('item');

  if (item) {
    await markAsEmptied(parseInt(item.toString(), 10), request);
  }

  return {};
}
export default function EmptyingLogPage(): JSX.Element {
  const { emptyingLogItems } = useLoaderData();

  return (
    <div>
      <H2 className="mt-8 mb-8">Tyhjennysloki</H2>

      {emptyingLogItems.length &&
        emptyingLogItems.map((item: EmptyingLogDTO) => {
          return (
            <form key={item.id} method="post" action="/emptying-log">
              <EmptyingLogItem item={item} />
            </form>
          );
        })}
    </div>
  );
}
