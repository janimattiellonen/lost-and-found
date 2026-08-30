import type { MessageTemplateDTO } from '~/types';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import Paper from '~/ui/Paper';
import Wrapper from '~/ui/Wrapper';
import MessageTemplateItem from '~/features/messaging/MessageTemplateItem';

import type { JSX } from 'react';

type Props = {
  messageTemplates: MessageTemplateDTO[];
};

export default function MessageTemplatesPage({ messageTemplates }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-4">Viestipohjat</H2>

      <Button to="/message-template/create" variant="contained">
        Luo uusi viestipohja
      </Button>

      <Wrapper>
        {messageTemplates.map((messageTemplate: MessageTemplateDTO) => {
          return (
            <Paper
              key={messageTemplate.id}
              className={messageTemplate.isDefault ? 'mb-8 mt-8' : 'mt-8'}
              style={messageTemplate.isDefault ? { border: 'solid rgba(2, 208, 232, 0.85) 4px' } : undefined}
              elevation={messageTemplate.isDefault ? 7 : 1}
              children={<MessageTemplateItem messageTemplate={messageTemplate} />}
            />
          );
        })}
      </Wrapper>
    </div>
  );
}
