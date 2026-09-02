import { useState, type JSX } from 'react';

import { Form, useFetcher } from 'react-router';

import { convertLineBreaks, lineBreakToBr, replaceTokensWithValues } from '~/features/messaging/messageContent';
import type { DiscDTO, MessageLogDTO, MessageTemplateDTO } from '~/types';
import { formatDate } from '~/utils';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import H3 from '~/ui/H3';
import Label from '~/ui/Label';
import PaperItem from '~/ui/PaperItem';
import Select, { MenuItem } from '~/ui/Select';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

type Props = {
  data: DiscDTO;
  messageTemplates: MessageTemplateDTO[];
  sentMessages: MessageLogDTO[];
};

export default function SendMessagePage({ data, messageTemplates, sentMessages }: Props): JSX.Element {
  const fetcher = useFetcher();

  // Seeded from the loader data, then owned by the form: the page is remounted
  // per disc, so there is nothing to sync afterwards.
  const defaultTemplate = messageTemplates.find((messageTemplate) => messageTemplate.isDefault === true);

  const [phoneNumber, setPhoneNumber] = useState<string>(data.ownerPhoneNumber ?? '');
  const [message, setMessage] = useState<string>(defaultTemplate?.content ?? '');
  const [selected, setSelected] = useState<number>(defaultTemplate?.id ?? -1);
  const ok: boolean = fetcher.data?.ok || false;

  const getStatusText = (): string => {
    if (ok) {
      return 'Lähetetty';
    } else if (fetcher.state !== 'idle') {
      return 'Lähetetään...';
    }

    return 'Merkitse viesti lähetetyksi';
  };

  return (
    <div>
      <H2 className="mt-8 mb-4">Viestin luonti</H2>

      <Wrapper>
        <H3>Käyttäjän tiedot</H3>
        <p>
          Nimi: {data.ownerName}
          <br />
          Ilmoitettu: {data.notifiedAt ? formatDate(data.notifiedAt) : ''}
        </p>
      </Wrapper>
      <Form method="post">
        <Wrapper>
          <H3>Viesti</H3>

          <Label htmlFor="phone">Puhelinnumero</Label>
          <input
            id="phone"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="email"
            placeholder="Sähköpostiosoite"
            name="email"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </Wrapper>

        <Wrapper>
          <Label htmlFor="message-template">Viestipohja</Label>

          <Select
            fullWidth
            value={selected.toString()}
            id="message-template"
            onChange={(e) => {
              const messageTemplate = messageTemplates.find(
                (item: MessageTemplateDTO) => item.id === parseInt(e.target.value, 10),
              );

              if (messageTemplate) {
                setMessage(messageTemplate.content);
                setSelected(messageTemplate.id ?? -1);
              }
            }}
          >
            <MenuItem value="-1">Valitse...</MenuItem>
            {messageTemplates.map((template: MessageTemplateDTO) => {
              return (
                <MenuItem key={template.id} value={template.id}>
                  {template.content}
                </MenuItem>
              );
            })}
          </Select>
        </Wrapper>
        <Wrapper>
          <Label htmlFor="message">Viesti</Label>

          <TextField
            id="message"
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            multiline
            rows={9}
            fullWidth
          />
        </Wrapper>
      </Form>
      <div className="flex justify-start gap-4">
        <Button color="error" variant="contained" to={`/`}>
          Peru
        </Button>
        <Button
          variant="contained"
          to={`sms:${phoneNumber}&body=${convertLineBreaks(replaceTokensWithValues(message, data))}`}
        >
          Lähetä tekstiviesti
        </Button>

        <fetcher.Form method="post">
          {/* From the loaded disc rather than the URL: the two are the same
              external id, and this way the form cannot post one the loader
              never resolved. */}
          <input type="hidden" name="externalId" value={data.externalId} />
          <input type="hidden" name="content" value={lineBreakToBr(replaceTokensWithValues(message, data))} />
          <Button type="submit" disabled={ok === true}>
            {getStatusText()}
          </Button>
        </fetcher.Form>
      </div>
      <Wrapper>
        <PaperItem>
          <>
            <H3 className="mb-2">Esikatselu</H3>
            <div dangerouslySetInnerHTML={{ __html: lineBreakToBr(replaceTokensWithValues(message, data)) }} />
          </>
        </PaperItem>
      </Wrapper>

      {sentMessages && sentMessages.length > 0 && (
        <Wrapper>
          <H2 className="mt-8">Lähetetyt viestit</H2>

          {sentMessages.map((message: MessageLogDTO, index: number) => {
            return (
              <PaperItem key={index}>
                <div dangerouslySetInnerHTML={{ __html: message.content }} />

                <div className="mt-4 font-bold">Lähetetty: {formatDate(message.sentAt)}</div>
              </PaperItem>
            );
          })}
        </Wrapper>
      )}
    </div>
  );
}
