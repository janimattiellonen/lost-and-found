import H3 from '~/ui/H3';
import Paper from '~/ui/Paper';

import type { JSX } from 'react';

type MessagePreviewProps = {
  message: string;
};
export default function MessagePreview({ message }: MessagePreviewProps): JSX.Element {
  return (
    <Paper className={'mt-8'} elevation={1}>
      <div className="p-4">
        <H3 className="mb-2">Esikatselu</H3>

        <div dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    </Paper>
  );
}
