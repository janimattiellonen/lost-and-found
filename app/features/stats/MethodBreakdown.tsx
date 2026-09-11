import type { MethodCount } from '~/features/stats/statsUtils';

import type { JSX } from 'react';

type Props = {
  counts: MethodCount[];
};

export default function MethodBreakdown({ counts }: Props): JSX.Element {
  return (
    <dl className="mt-1 mb-4 ml-4">
      {counts.map((count) => (
        <div key={count.label} className="flex gap-2">
          <dt>{count.label}:</dt>
          <dd>{count.value}</dd>
        </div>
      ))}
    </dl>
  );
}
