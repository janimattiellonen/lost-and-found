import { Form } from 'react-router';

import { retrievalErrandLabel } from './retrievalErrand';
import { retrievalMethodLabel } from './retrievalMethod';
import type { RetrievalListDisc } from './discRetrieval';
import { formatDate, formatPhoneNumber, toDiallablePhoneNumber } from '~/utils';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import Paper from '~/ui/Paper';

import type { JSX } from 'react';

type Props = {
  discs: RetrievalListDisc[];
};

/**
 * The discs still to be fetched, read where they are kept.
 *
 * Cards rather than a table: this is read on a phone, standing in front of the
 * shelf, and the four things it carries are the four things that used to be
 * typed into a notepad app.
 *
 * The text says nothing about *where* the disc is. One club keeps its discs in
 * a koppi the admin drives to and the other on his own shelf, and a wording per
 * club would be a second place recording which -- `clubs.stores_discs_offsite`
 * is the first, and it is the one the owner-facing page reads.
 */
export default function RetrievalListPage({ discs }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-2">Noutolista</H2>

      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Kiekot, joita ei ole vielä haettu: omistajien pyytämät sekä myyntiin tai lahjoitukseen menevät. Merkitse kiekko
        noudetuksi, kun se on sinulla – kiekon palautus omistajalle merkitään erikseen kiekkolistalla.
      </p>

      {discs.length === 0 && <p className="text-gray-500">Noutolistalla ei ole kiekkoja.</p>}

      {discs.map((disc) => (
        <RetrievalListItem key={disc.externalId} disc={disc} />
      ))}
    </div>
  );
}

function RetrievalListItem({ disc }: { disc: RetrievalListDisc }): JSX.Element {
  // What is to be done with this one: the method its owner asked for, or that
  // the club is keeping it.
  const errand = retrievalErrandLabel(disc.errand);
  const { supersededMethod } = disc;

  return (
    <Paper className="mb-4 max-w-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-bold">
            {disc.discColour} {disc.discName}
          </span>

          {errand && <span className="text-sm text-gray-600">{errand}</span>}

          {/* The club has decided to keep a disc its owner had asked for. Both
              facts are true and they disagree, so the card says both rather
              than quietly showing the newer one: this is the line that tells
              the admin there is a message to send before the disc goes to the
              bring-and-buy table. */}
          {supersededMethod !== null && (
            <span className="text-sm font-bold text-amber-700">
              Huom! Omistaja on pyytänyt kiekkoa: {retrievalMethodLabel(supersededMethod)}
            </span>
          )}

          {/* A link rather than plain digits: the number is here to be texted
              from the same phone the list is read on, so it opens a message to
              the owner rather than placing a call. The name comes after it in
              brackets, outside the link — only the digits are tappable. */}
          {(disc.ownerPhoneNumber || disc.ownerName) && (
            <span className="text-sm text-gray-600">
              {disc.ownerPhoneNumber && (
                <a href={`sms:${toDiallablePhoneNumber(disc.ownerPhoneNumber)}`} className="text-blue-700 underline">
                  {formatPhoneNumber(disc.ownerPhoneNumber)}
                </a>
              )}
              {disc.ownerName && (disc.ownerPhoneNumber ? ` (${disc.ownerName})` : disc.ownerName)}
            </span>
          )}

          {/* The dates last and together, as on the answers page: the request
              date is what the card is read for -- one from three weeks ago is
              one to ask about -- and the day the disc was written down says how
              long it has been on the shelf. */}
          <span className="mt-2 text-xs text-gray-500">
            Pyydetty {formatDate(disc.requestedAt)} · Kirjattu {formatDate(disc.addedAt)}
          </span>
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
