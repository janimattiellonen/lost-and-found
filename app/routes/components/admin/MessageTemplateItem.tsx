import { useFetcher } from '@remix-run/react';

import styled from '@emotion/styled';

import { Link } from '@remix-run/react';
import Button from '@mui/material/Button';

import { formatDate } from '~/routes/utils';
import { MessageTemplateDTO } from '~/types';

type MessageTemplateProps = {
  messageTemplate: MessageTemplateDTO;
};

function convertLineBreaks(value: string): string {
  return value.replaceAll('\n', '<br/>');
}

export default function MessageTemplateItem({ messageTemplate }: MessageTemplateProps): JSX.Element {
  const fetcher = useFetcher();

  return (
    <div className="p-4">
      <div dangerouslySetInnerHTML={{ __html: convertLineBreaks(messageTemplate.content) }} />
      {messageTemplate.createdAt && (
        <div className="mt-2 font-bold">Luotu: {formatDate(messageTemplate.createdAt)}</div>
      )}

      <fetcher.Form method="post">
        <input type="hidden" name="id" value={messageTemplate.id} />
        <div className="flex justify-end mt-4">
          <Button name="action" value={'default'} type="submit">
            Merkitse oletukseksi
          </Button>
          <Button component={Link} to={`/message-template/${messageTemplate.id}/edit`}>
            Muokkaa
          </Button>
          <Button
            color="error"
            variant="contained"
            name="action"
            value={'delete'}
            type="submit"
            onClick={(e) => {
              if (!confirm('Are you sure?')) {
                e.preventDefault();
              }
            }}
          >
            Poista
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
