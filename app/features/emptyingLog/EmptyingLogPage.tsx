import AdminEmptyingLogItem from '~/features/emptyingLog/AdminEmptyingLogItem';
import type { EmptyingLogDTO } from '~/types';
import H2 from '~/ui/H2';

import type { JSX } from 'react';

type Props = {
  emptyingLogItems: EmptyingLogDTO[];
};

export default function EmptyingLogPage({ emptyingLogItems }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-8">Tyhjennysloki</H2>

      {emptyingLogItems.length &&
        emptyingLogItems.map((item: EmptyingLogDTO) => {
          return (
            <form key={item.id} method="post" action="/emptying-log">
              <AdminEmptyingLogItem item={item} />
            </form>
          );
        })}
    </div>
  );
}
