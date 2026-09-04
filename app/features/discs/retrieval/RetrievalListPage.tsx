import { Form } from 'react-router';

import { retrievalMethodLabel } from './retrievalMethod';
import type { RetrievalListDisc } from './discRetrieval';
import { formatDate, formatPhoneNumber } from '~/utils';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import Paper from '~/ui/Paper';

import type { JSX } from 'react';

type Props = {
  discs: RetrievalListDisc[];
};

/**
 * The discs to fetch out of the club's storage, read in the storage itself.
 *
 * Cards rather than a table: this is read on a phone, standing in front of the
 * shelf, and the four things it carries are the four things that used to be
 * typed into a notepad app.
 */
export default function RetrievalListPage({ discs }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-2">Noutolista</H2>

      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Kiekot, joita omistajat ovat pyytäneet ja jotka ovat vielä seuran varastossa. Merkitse kiekko noudetuksi, kun
        olet hakenut sen varastosta – kiekon palautus omistajalle merkitään erikseen kiekkolistalla.
      </p>

      {discs.length === 0 && <p className="text-gray-500">Noutolistalla ei ole kiekkoja.</p>}

      {discs.map((disc) => (
        <RetrievalListItem key={disc.externalId} disc={disc} />
      ))}
    </div>
  );
}

function RetrievalListItem({ disc }: { disc: RetrievalListDisc }): JSX.Element {
  const method = retrievalMethodLabel(disc.retrievalMethod);

  return (
    <Paper className="mb-4 max-w-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-bold">
            {disc.discColour} {disc.discName}
          </span>

          <span className="text-sm text-gray-600">
            Kirjattu {formatDate(disc.addedAt)}
            {method && ` · ${method}`}
          </span>

          {/* What the notepad never recorded. Worth having on the card: a
              request from three weeks ago is one to ask about. */}
          <span className="text-sm text-gray-600">Pyydetty {formatDate(disc.requestedAt)}</span>

          {/* A link rather than plain digits: the number is here to be called
              or texted from the same phone the list is read on. */}
          {disc.ownerPhoneNumber && (
            <a href={`tel:${disc.ownerPhoneNumber}`} className="text-sm text-blue-700 underline">
              {formatPhoneNumber(disc.ownerPhoneNumber)}
            </a>
          )}

          {disc.ownerName && <span className="text-sm text-gray-600">{disc.ownerName}</span>}
        </div>

        {/* Confirmed, because it is the one thing on this page that changes
            anything and the button sits under a thumb. */}
        <Form
          method="post"
          onSubmit={(event) => {
            if (!window.confirm(`Merkitäänkö kiekko ${disc.discColour} ${disc.discName} noudetuksi?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="externalId" value={disc.externalId} />
          <Button variant="contained" type="submit">
            Merkitse noudetuksi
          </Button>
        </Form>
      </div>
    </Paper>
  );
}
