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
};

/**
 * What the owners have answered, and nothing else.
 *
 * The answers are only recorded here — marking a disc returned or released for
 * sale stays where it was, on the disc list. This page says what people asked
 * for; acting on it is still a decision, and one an answer from a link should
 * not make on the admin's behalf.
 */
export default function OwnerResponsesPage({ responses }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-2">Omistajien vastaukset</H2>

      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Kiekkojen omistajien vastaukset tekstiviestin linkistä. Merkitse vastaus käsitellyksi, kun olet hoitanut asian –
        postitusosoite poistetaan samalla.
      </p>

      {responses.length === 0 && <p className="text-gray-500">Ei uusia vastauksia.</p>}

      {responses.map((response) => (
        <ResponseItem key={response.id} response={response} />
      ))}
    </div>
  );
}

function ResponseItem({ response }: { response: OwnerResponseSummary }): JSX.Element {
  const method = handoverMethodLabel(response.handoverMethod);

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

        {/* Confirmed, because it is what wipes the address. */}
        <Form
          method="post"
          onSubmit={(event) => {
            if (!window.confirm('Merkitäänkö vastaus käsitellyksi? Postitusosoite poistetaan.')) {
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
    </Paper>
  );
}
