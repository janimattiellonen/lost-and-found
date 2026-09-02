import { useEffect, useRef, useState, type JSX } from 'react';

import { Form, useFetcher } from 'react-router';

import { convertLineBreaks, lineBreakToBr, replaceTokensWithValues } from '~/features/messaging/messageContent';
import type { DiscDTO, MessageLogDTO, MessageTemplateDTO } from '~/types';
import { formatDate, formatPhoneNumber } from '~/utils';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import H3 from '~/ui/H3';
import Label from '~/ui/Label';
import PaperItem from '~/ui/PaperItem';
import Select, { MenuItem } from '~/ui/Select';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

type Props = {
  disc: DiscDTO;
  messageTemplates: MessageTemplateDTO[];
  sentMessages: MessageLogDTO[];
  /** Peru: one disc's message abandoned. */
  onCancel: () => void;
  /**
   * Called once the send has been recorded. Given while working through a
   * selection, where recording moves on to the next disc; absent for a single
   * disc, where the page just reports that it was recorded.
   */
  onRecorded?: () => void;
  /** Where this disc sits in a selection. Absent for a single disc. */
  progress?: { position: number; total: number };
};

/**
 * The number as the phone should receive it: no grouping spaces, which an
 * sms: target does not take.
 */
function toDiallable(phoneNumber: string): string {
  return phoneNumber.replace(/\s/g, '');
}

/**
 * Composing one message to one disc's owner.
 *
 * The form itself, shared by the single-disc page and the batch one: nothing
 * here knows which of the two it is in, beyond the two callbacks and the
 * optional progress line.
 *
 * Mount this with a key of the disc's external id when working through a
 * selection. Every field below is seeded from the disc and then owned by the
 * form, so a remount is what re-seeds them for the next owner.
 */
export default function MessageComposer({
  disc,
  messageTemplates,
  sentMessages,
  onCancel,
  onRecorded,
  progress,
}: Props): JSX.Element {
  const fetcher = useFetcher();

  const defaultTemplate = messageTemplates.find((messageTemplate) => messageTemplate.isDefault === true);

  // Grouped for reading, the way the disc list shows it. The field stays
  // editable, so what is typed into it is left alone — the sms: link takes the
  // grouping back out rather than this reformatting as the admin types.
  const [phoneNumber, setPhoneNumber] = useState<string>(formatPhoneNumber(disc.ownerPhoneNumber));
  const [message, setMessage] = useState<string>(defaultTemplate?.content ?? '');
  const [selected, setSelected] = useState<number>(defaultTemplate?.id ?? -1);
  const ok: boolean = fetcher.data?.ok || false;

  // Once per mount, whatever the callback's identity does between renders:
  // advancing twice would skip an owner silently.
  const hasReported = useRef(false);

  useEffect(() => {
    if (ok && onRecorded && !hasReported.current) {
      hasReported.current = true;

      onRecorded();
    }
  }, [ok, onRecorded]);

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

      {progress && (
        <p className="mb-4 text-sm">
          Kiekko {progress.position} / {progress.total} — <span className="font-bold">{disc.discName}</span>
          {disc.discColour ? `, ${disc.discColour}` : ''}
        </p>
      )}

      <Wrapper>
        <H3>Käyttäjän tiedot</H3>
        <p>
          Nimi: {disc.ownerName}
          <br />
          Ilmoitettu: {disc.notifiedAt ? formatDate(disc.notifiedAt) : ''}
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
        <Button color="error" variant="contained" onClick={onCancel}>
          Peru
        </Button>
        <Button
          variant="contained"
          to={`sms:${toDiallable(phoneNumber)}&body=${convertLineBreaks(replaceTokensWithValues(message, disc))}`}
        >
          Lähetä tekstiviesti
        </Button>

        <fetcher.Form method="post">
          {/* From the loaded disc rather than the URL: the two are the same
              external id, and this way the form cannot post one the loader
              never resolved. */}
          <input type="hidden" name="externalId" value={disc.externalId} />
          <input type="hidden" name="content" value={lineBreakToBr(replaceTokensWithValues(message, disc))} />
          <Button type="submit" disabled={ok === true}>
            {getStatusText()}
          </Button>
        </fetcher.Form>
      </div>
      <Wrapper>
        <PaperItem>
          <>
            <H3 className="mb-2">Esikatselu</H3>
            <div dangerouslySetInnerHTML={{ __html: lineBreakToBr(replaceTokensWithValues(message, disc)) }} />
          </>
        </PaperItem>
      </Wrapper>

      {sentMessages && sentMessages.length > 0 && (
        <Wrapper>
          <H2 className="mt-8">Lähetetyt viestit</H2>

          {sentMessages.map((sentMessage: MessageLogDTO, index: number) => {
            return (
              <PaperItem key={index}>
                <div dangerouslySetInnerHTML={{ __html: sentMessage.content }} />

                <div className="mt-4 font-bold">Lähetetty: {formatDate(sentMessage.sentAt)}</div>
              </PaperItem>
            );
          })}
        </Wrapper>
      )}
    </div>
  );
}
