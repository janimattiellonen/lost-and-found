import { Form } from 'react-router';

import { retrievalErrandLabel, supersededRequestLabel } from './retrievalErrand';
import type { RetrievalListDisc } from './discRetrieval';
import { formatDate } from '~/utils';
import Button from '~/ui/Button';
import ContactLine from '~/ui/ContactLine';
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

      <p className="mb-6 max-w-2xl text-sm text-fg-body">
        Kiekot, joita ei ole vielä haettu: omistajien pyytämät sekä myyntiin tai lahjoitukseen menevät. Merkitse kiekko
        noudetuksi, kun se on sinulla – kiekon palautus omistajalle merkitään erikseen kiekkolistalla.
      </p>

      {discs.length === 0 && <p className="text-fg-muted">Noutolistalla ei ole kiekkoja.</p>}

      {discs.map((disc) => (
        <RetrievalListItem key={disc.externalId} disc={disc} />
      ))}
    </div>
  );
}

function RetrievalListItem({ disc }: { disc: RetrievalListDisc }): JSX.Element {
  // What is to be done with this one: the method its owner asked for, that the
  // club is keeping it, or that the row cannot be read.
  const errand = retrievalErrandLabel(disc.errand);
  const { superseded } = disc;

  return (
    <Paper className="mb-4 max-w-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-bold">
            {disc.discColour} {disc.discName}
          </span>

          <span className="text-sm text-fg-body">{errand}</span>

          {/* The club has decided to keep a disc its owner had asked for. Both
              facts are true and they disagree, so the card says both rather
              than quietly showing the newer one: this is the line that tells
              the admin there is a message to send before the disc goes to the
              bring-and-buy table. */}
          {superseded !== null && (
            <span className="text-sm font-bold text-warning">{supersededRequestLabel(superseded)}</span>
          )}

          <ContactLine phoneNumber={disc.ownerPhoneNumber} name={disc.ownerName} />

          {/* The dates last and together, as on the answers page: the request
              date is what the card is read for -- one from three weeks ago is
              one to ask about -- and the day the disc was written down says how
              long it has been on the shelf. */}
          <span className="mt-2 text-xs text-fg-muted">
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
