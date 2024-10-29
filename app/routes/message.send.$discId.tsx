import { Form, Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useState, useEffect } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import { ActionArgs, json, LoaderArgs, redirect } from '@remix-run/node';
import { isUserLoggedIn } from '~/models/utils';
import { getDiscWithFullPhoneNumber } from '~/models/discs.server';
import { getMessageTemplates } from '~/models/messageTemplate.server';

import { getSentMessages, markAsSent } from '~/models/messageLog.server';

import { MessageLogDTO, MessageTemplateDTO } from '~/types';

import H2 from './components/H2';

import Label from './components/Label';
import Wrapper from './components/Wrapper';
import PaperItem from '~/routes/components/PaperItem';

import { formatDate } from '~/routes/utils';
import { convertLineBreaks, lineBreakToBr, replaceTokensWithValues } from '~/routes/components/admin/message-utils';
import H3 from '~/routes/components/H3';

export const loader = async ({ request, params }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const discId: number = parseInt(params.discId || '', 10);

  const messageTemplates = await getMessageTemplates(request);
  const sentMessages = await getSentMessages(discId, request);
  const data = await getDiscWithFullPhoneNumber(discId);

  return json({ data, messageTemplates, sentMessages });
};

export async function action({ request }: ActionArgs) {
  const form = await request.formData();

  const id = form.get('id');

  const internalDiscId = parseInt(id ? id.toString() : '', 10);
  const content = form.get('content');

  await markAsSent(internalDiscId, content ? content.toString() : '', request);

  return json({ ok: true });
}

export default function SendNotificationPage(): JSX.Element {
  const params = useParams();
  const fetcher = useFetcher();

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [selected, setSelected] = useState<number>(-1);
  const { data, messageTemplates, sentMessages } = useLoaderData();
  const ok: boolean = fetcher.data?.ok || false;

  const getStatusText = (): string => {
    if (ok) {
      return 'Lähetetty';
    } else if (fetcher.state !== 'idle') {
      return 'Lähetetään...';
    }

    return 'Merkitse viesti lähetetyksi';
  };

  // const selected = messageTemplates.find((messageTemplate: MessageTemplateDTO) => messageTemplate.isDefault === true);

  useEffect(() => {
    setPhoneNumber(data.ownerPhoneNumber);
  }, []);

  useEffect(() => {
    const s = messageTemplates.find((messageTemplate: MessageTemplateDTO) => messageTemplate.isDefault === true);
    setMessage(s.content);
    setSelected(s.id);
  }, []);

  console.log(`data: ${JSON.stringify(data, null, 2)}`);
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
            className="[width:100%]"
            value={selected.toString()}
            id="message-template"
            onChange={(e: SelectChangeEvent) => {
              const messageTemplate = messageTemplates.find(
                (item: MessageTemplateDTO) => item.id === parseInt(e.target.value, 10),
              );

              if (messageTemplate) {
                setMessage(messageTemplate.content);
                setSelected(messageTemplate.id);
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="message"
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            multiline
            rows={9}
          />
        </Wrapper>
      </Form>
      <div className="flex justify-start gap-4">
        <Button color="error" variant="contained" component={Link} to={`/`}>
          Peru
        </Button>
        <Button
          variant="contained"
          component={Link}
          to={`sms:${phoneNumber}&body=${convertLineBreaks(replaceTokensWithValues(message, data))}`}
        >
          Lähetä tekstiviesti
        </Button>

        <fetcher.Form method="post">
          <input type="hidden" name="id" value={params.discId} />
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
