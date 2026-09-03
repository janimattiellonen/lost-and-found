import { useState, type JSX, type ReactNode } from 'react';
import { Form } from 'react-router';

import type { ClubPayment } from '~/config/clubs';
import { formatPostageFee, POSTAGE_PAYEE_NAME, POSTAGE_PAYEE_NUMBER } from '~/config/shipping';
import { HandoverMethod, type HandoverMethodValue } from '~/features/discs/handoverMethod';
import { OwnerChoice, type OwnerChoiceValue } from './ownerChoice';
import type { OwnerLinkDisc } from './ownerResponse';
import type { OwnerLinkActionResult } from './handleOwnerLinkSubmit.server';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

type Props = {
  disc: OwnerLinkDisc | null;
  /** Where this club takes the voluntary thank-you, or null if it takes none. */
  clubPayment: ClubPayment | null;
  /** Where the owner writes if any of this goes wrong. */
  contactEmail: string;
  /** The token, so the thank-you screen can offer the same page again. */
  token: string;
  result?: OwnerLinkActionResult;
};

/**
 * What each option is called to the owner reading it.
 *
 * Fuller than the club's own shorthand ("Postitus", "Nouto varastolta"): this
 * is read once, on a phone, by someone who has not seen the admin pages. The
 * collection options name no street address: collecting from the admin says
 * only the district, with the rest agreed by message (see followUp).
 */
const OWNER_LABELS: Record<HandoverMethodValue, string> = {
  [HandoverMethod.ByMail]: 'Postita kiekko minulle',
  [HandoverMethod.PickedUpFromHome]: 'Noudan kiekon – sovitaan noudosta erikseen',
  [HandoverMethod.PickedUpFromStorage]: 'Noudan kiekon seuran varastolta',
};

export default function OwnerLinkPage({ disc, clubPayment, contactEmail, token, result }: Props): JSX.Element {
  const [choice, setChoice] = useState<OwnerChoiceValue | null>(null);
  const [handoverMethod, setHandoverMethod] = useState<HandoverMethodValue | null>(null);

  // An unusable link and a disc the club has already dealt with are the same
  // message on purpose: the owner needs to talk to the club either way, and a
  // stranger holding the link learns nothing from which it was.
  if (!disc) {
    return (
      <Centered>
        <H2 className="mb-4">Linkki ei ole enää käytössä</H2>
        <p className="text-gray-700 text-center">
          Kiekko on ehkä jo palautettu tai luovutettu. Ota yhteyttä seuraan, jos asia on vielä kesken.
        </p>
        <ContactNote contactEmail={contactEmail} className="mt-6 text-center" />
      </Centered>
    );
  }

  if (result && 'saved' in result) {
    return (
      <Centered>
        <div className="text-5xl mb-6">&#9989;</div>
        <H2 className="mb-4">Kiitos vastauksesta!</H2>
        <p className="text-gray-700 mb-8 text-center text-lg">
          Seura hoitaa asian eteenpäin. Voit muuttaa valintaasi samasta linkistä, jos tulee muutoksia.
        </p>
        <Button variant="outlined" size="large" to={`/kiekko/${token}`}>
          Muuta valintaa
        </Button>
      </Centered>
    );
  }

  const wantsItBack = choice === OwnerChoice.WantsItBack;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <H2 className="mb-2">Löytynyt kiekkosi</H2>

      {/* Everything shown here is already on the club's public löytökiekot
          list, which is why a forwarded link gives nothing away. */}
      <p className="mb-1 text-lg font-bold">
        {disc.discColour} {disc.discName}
      </p>
      {disc.discManufacturer && <p className="mb-1 text-gray-700">{disc.discManufacturer}</p>}
      {disc.phoneNumberEnding && <p className="mb-6 text-gray-700">Puhelinnumero ****{disc.phoneNumberEnding}</p>}

      <p className="text-gray-700 mb-8 leading-relaxed">
        Tämän lomakkeen kautta voit ilmoittaa, haluatko kiekon takaisin vai lahjoitatko kiekon seuralle.
      </p>

      {result && 'error' in result && <p className="mb-6 text-red-600">{result.error}</p>}

      <Form method="post">
        {/* Each follow-up question is nested inside the answer that raises it,
            rather than appearing as a section further down the page: on a phone
            the owner sees the next question right where they just tapped, and
            which answer the extra fields belong to needs no explaining. */}
        <fieldset className="mb-6">
          <legend className="mb-2 font-bold">Haluatko kiekon takaisin?</legend>

          <Choice
            name="choice"
            value={OwnerChoice.WantsItBack}
            checked={wantsItBack}
            onChange={setChoice}
            label="Kyllä, haluan kiekon takaisin"
          >
            <fieldset>
              <legend className="mb-2 font-bold">Miten haluat kiekon?</legend>

              {/* Only the ways this disc can actually travel: collecting it from
                  the club's storage is offered while it is still there. */}
              {disc.handoverMethods.map((method) => (
                <Choice
                  key={method}
                  name="handoverMethod"
                  value={method}
                  checked={handoverMethod === method}
                  onChange={setHandoverMethod}
                  label={OWNER_LABELS[method]}
                >
                  {followUp(method, clubPayment)}
                </Choice>
              ))}
            </fieldset>
          </Choice>

          <Choice
            name="choice"
            value={OwnerChoice.GivesUp}
            checked={choice === OwnerChoice.GivesUp}
            onChange={setChoice}
            label="Ei, seura saa pitää kiekon"
          />
        </fieldset>

        <Button variant="contained" size="large" type="submit" fullWidth disabled={choice === null}>
          Lähetä vastaus
        </Button>
      </Form>

      <ContactNote contactEmail={contactEmail} className="mt-8" />
    </div>
  );
}

/**
 * What each way of getting the disc back asks of the owner next, or null for
 * one that asks nothing.
 *
 * Returned rather than written as a chain of `&&` inside the option, so a
 * method with no follow-up gives back nothing at all: an empty panel would
 * still draw its own outline under the option.
 */
function followUp(method: HandoverMethodValue, clubPayment: ClubPayment | null): ReactNode {
  switch (method) {
    case HandoverMethod.ByMail:
      return <ShippingAddress clubPayment={clubPayment} />;
    case HandoverMethod.PickedUpFromHome:
      return <PickupNote />;
    default:
      return null;
  }
}

/**
 * Collecting the disc from the admin.
 *
 * Names the district and no more: the exact address and a time are agreed by
 * message, which is also what keeps this page from handing a street address to
 * anyone holding a forwarded link.
 */
function PickupNote(): JSX.Element {
  return (
    <p className="text-gray-700">Kiekon voi noutaa Espoon Lintuvaarasta. Saat pian viestin, jossa tarkemmat ohjeet.</p>
  );
}

/**
 * Where to post the disc, and what the owner has to do for it to be posted.
 *
 * Only rendered under the posting option, which is what keeps `required` off
 * the other two answers: the fields are not in the form at all unless they
 * apply. The instructions sit above the fields for the same reason: the cost
 * is part of choosing this option, not an afterthought once it is chosen.
 */
function ShippingAddress({ clubPayment }: { clubPayment: ClubPayment | null }): JSX.Element {
  return (
    <div>
      <p className="mb-2 font-bold">Ohjeet</p>

      <ul className="mb-6 list-disc space-y-2 pl-5 text-gray-700">
        <li>
          Maksa MobilePaylla {formatPostageFee()} numeroon <strong>{POSTAGE_PAYEE_NUMBER}</strong> ({POSTAGE_PAYEE_NAME}
          ).
        </li>
        {clubPayment && (
          <li>
            Vapaaehtoisen vaivanpalkan voit halutessasi maksaa seuralle numeroon <strong>{clubPayment.number}</strong> (
            {clubPayment.name}).
          </li>
        )}
        <li>
          Ilmoita tekstiviestitse numeroon <strong>{POSTAGE_PAYEE_NUMBER}</strong> kun olet maksanut.
        </li>
        <li>Muista antaa koko osoite!</li>
      </ul>

      <p className="mb-4 font-bold">Postitusosoite</p>

      <Wrapper>
        <Label htmlFor="shippingName">Nimi</Label>
        <TextField id="shippingName" name="shippingName" fullWidth required />
      </Wrapper>
      <Wrapper>
        <Label htmlFor="shippingStreet">Katuosoite</Label>
        <TextField id="shippingStreet" name="shippingStreet" fullWidth required />
      </Wrapper>
      <Wrapper>
        <Label htmlFor="shippingPostalCode">Postinumero</Label>
        <TextField id="shippingPostalCode" name="shippingPostalCode" fullWidth required />
      </Wrapper>
      <Wrapper>
        <Label htmlFor="shippingCity">Postitoimipaikka</Label>
        <TextField id="shippingCity" name="shippingCity" fullWidth required />
      </Wrapper>
      <Wrapper>
        <Label htmlFor="shippingCountry">Maa</Label>
        <TextField id="shippingCountry" name="shippingCountry" fullWidth placeholder="Suomi" />
      </Wrapper>

      <p className="mt-2 text-sm text-gray-600">
        Osoitetta käytetään vain tämän kiekon postittamiseen, ja se poistetaan kun kiekko on lähetetty.
      </p>
    </div>
  );
}

/**
 * Who to write to when something about this does not work.
 *
 * Shown on the form and on the dead-link screen, which is the one that tells an
 * owner to contact the club without otherwise saying how.
 */
function ContactNote({ contactEmail, className }: { contactEmail: string; className?: string }): JSX.Element {
  return (
    <p className={`text-sm text-gray-600 ${className ?? ''}`}>
      Jos jokin ei toimi tai haluat kysyä jotain, ota yhteyttä{' '}
      <a className="underline" href={`mailto:${contactEmail}`}>
        {contactEmail}
      </a>
      .
    </p>
  );
}

type ChoiceProps<V extends number> = {
  name: string;
  value: V;
  checked: boolean;
  onChange: (value: V) => void;
  label: string;
  /** What this answer asks next, shown inside it once it is chosen. */
  children?: ReactNode;
};

/**
 * One radio, with its whole row as the target, and whatever that answer asks
 * next kept within its own outline.
 *
 * Read on a phone, often outdoors, so the tappable area is the label rather
 * than the twelve pixels of the control. The chosen state is drawn from the
 * prop rather than Tailwind's `has-[:checked]`, which needs 3.4 and this
 * project is on 3.3.
 */
function Choice<V extends number>({ name, value, checked, onChange, label, children }: ChoiceProps<V>): JSX.Element {
  return (
    <div className={`mb-2 rounded border ${checked ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'}`}>
      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
        <span>{label}</span>
      </label>

      {checked && children && <div className="rounded-b border-t border-blue-200 bg-white px-4 py-4">{children}</div>}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">{children}</div>;
}
