import { Form, useLoaderData } from '@remix-run/react';

import styled from '@emotion/styled';

import { Link } from '@remix-run/react';

import { useState, useEffect } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

// import { Form, useActionData, useLoaderData, useOutletContext } from '@remix-run/react';

import { json, LoaderArgs, redirect } from '@remix-run/node';
import { isUserLoggedIn } from '~/models/utils';
import { getDiscWithFullPhoneNumber } from '~/models/discs.server';
import { getMessageTemplates } from '~/models/messageTemplate.server';

import { DiscDTO, MessageTemplateDTO } from '~/types';

import H2 from './components/H2';
import Label from './components/Label';
import Wrapper from './components/Wrapper';

export const loader = async ({ request, params }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const discId: number = parseInt(params.discId || '', 10);

  const messageTemplates = await getMessageTemplates(request);
  const data = await getDiscWithFullPhoneNumber(discId);

  return json({ data, messageTemplates });
};

function convertLineBreaks(value: string): string {
  return value.replaceAll('\n', '%0a');
}

function replaceTokensWithValues(message: string, disc: DiscDTO): string {
  return message
    .replace('[colour]', disc.discColour ? disc.discColour : '')
    .replace('[disc]', disc.discName ? disc.discName : '');
}

export default function SendNotificationPage(): JSX.Element {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const { data, messageTemplates } = useLoaderData();

  const selected = messageTemplates.find((messageTemplate: MessageTemplateDTO) => messageTemplate.isDefault === true);

  useEffect(() => {
    setPhoneNumber(data.ownerPhoneNumber);
  }, []);

  useEffect(() => {
    setMessage(selected.content);
  }, []);

  return (
    <div>
      <H2 className="mt-8 mb-4">Viestin luonti</H2>

      <Form method="post">
        <Wrapper>
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
            value={selected ? selected.id : -1}
            id="message-template"
            onChange={(e: SelectChangeEvent) => {
              const messageTemplate = messageTemplates.find(
                (item: MessageTemplateDTO) => item.id === parseInt(e.target.value, 10),
              );

              if (messageTemplate) {
                setMessage(messageTemplate.content);
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
        </div>
      </Form>
    </div>
  );
}
