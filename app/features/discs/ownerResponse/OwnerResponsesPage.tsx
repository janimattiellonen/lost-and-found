import { Form } from 'react-router';

import { handoverMethodLabel } from '~/features/discs/handoverMethod';
import { ownerChoiceLabel, OwnerChoice } from './ownerChoice';
import type { OwnerResponseSummary } from './ownerResponse';
import { formatDateTime, formatPhoneNumber } from '~/utils';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import Paper from '~/ui/Paper';

import type { JSX } from 'react';

type Props = {
  responses: OwnerResponseSummary[];
  /**
   * The message template category a message sent from here should pick from,
   * or null when this club has none. See specs/06-messaging-and-templates.md.
   */
  messageCategoryId: number | null;
};

/**
 * What the owners have answered, and nothing else.
 *
 * The answers are only recorded here — marking a disc returned or released for
 * sale stays where it was, on the disc list. This page says what people asked
 * for; acting on it is still a decision, and one an answer from a link should
 * not make on the admin's behalf.
 */
export default function OwnerResponsesPage({ responses, messageCategoryId }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-2">Omistajien vastaukset</H2>

      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Kiekkojen omistajien vastaukset tekstiviestin linkistä. Merkitse vastaus käsitellyksi, kun olet hoitanut asian –
        postitusosoite poistetaan samalla.
      </p>

      {responses.length === 0 && <p className="text-gray-500">Ei uusia vastauksia.</p>}

      {responses.map((response) => (
        <ResponseItem key={response.id} response={response} messageCategoryId={messageCategoryId} />
      ))}
    </div>
  );
}

function ResponseItem({
  response,
  messageCategoryId,
}: {
  response: OwnerResponseSummary;
  messageCategoryId: number | null;
}): JSX.Element {
  const method = handoverMethodLabel(response.handoverMethod);

  // The composer, narrowed to the templates written for someone who has already
  // answered. Without a category it is the same page the disc list opens, which
  // offers every template the club has.
  const composerPath =
    `/message/send/${response.externalId}` + (messageCategoryId === null ? '' : `?category=${messageCategoryId}`);

  return (
    <Paper className="mb-4 max-w-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-bold">
            {response.discColour} {response.discName}
          </span>

          <span className={response.choice === OwnerChoice.GivesUp ? 'text-sm text-amber-700' : 'text-sm'}>
            {ownerChoiceLabel(response.choice)}
            {method && ` · ${method}`}
          </span>

          {response.ownerName && <span className="text-sm text-gray-600">{response.ownerName}</span>}

          {response.ownerPhoneNumber && (
            <a href={`tel:${response.ownerPhoneNumber}`} className="text-sm text-blue-700 underline">
              {formatPhoneNumber(response.ownerPhoneNumber)}
            </a>
          )}

          {/* No address to show, and a reason: this one needs a message before
              anything can be posted. */}
          {response.hasMoreDiscs && (
            <span className="mt-2 text-sm font-bold text-amber-700">
              Useampia kiekkoja – sovi sisällöstä ja postikuluista viestitse.
            </span>
          )}

          {response.address && (
            <span className="mt-2 whitespace-pre-line text-sm">
              {[
                response.address.name,
                response.address.street,
                `${response.address.postalCode} ${response.address.city}`.trim(),
                response.address.country,
              ]
                .filter(Boolean)
                .join('\n')}
            </span>
          )}

          <span className="mt-2 text-xs text-gray-500">Vastattu {formatDateTime(response.respondedAt)}</span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button to={composerPath} variant="contained">
            Lähetä viesti
          </Button>

          {/* Confirmed, because it is what wipes the address. */}
          <Form
            method="post"
            onSubmit={(event) => {
              const warning = response.address
                ? 'Merkitäänkö vastaus käsitellyksi? Postitusosoite poistetaan.'
                : 'Merkitäänkö vastaus käsitellyksi?';

              if (!window.confirm(warning)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="responseId" value={response.id} />
            <Button variant="contained" type="submit">
              Merkitse käsitellyksi
            </Button>
          </Form>
        </div>
      </div>
    </Paper>
  );
}
