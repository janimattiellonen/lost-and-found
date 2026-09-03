import type { JSX } from 'react';

import { useNavigate } from 'react-router';

import MessageComposer from '~/features/messaging/MessageComposer';
import type { DiscDTO, MessageLogDTO, MessageTemplateDTO } from '~/types';

type Props = {
  data: DiscDTO;
  messageTemplates: MessageTemplateDTO[];
  sentMessages: MessageLogDTO[];
  baseUrl: string;
};

/** Messaging the owner of one disc, reached from that disc's row in the list. */
export default function SendMessagePage({ data, messageTemplates, sentMessages, baseUrl }: Props): JSX.Element {
  const navigate = useNavigate();

  return (
    <MessageComposer
      disc={data}
      messageTemplates={messageTemplates}
      sentMessages={sentMessages}
      baseUrl={baseUrl}
      onCancel={() => navigate('/')}
    />
  );
}
