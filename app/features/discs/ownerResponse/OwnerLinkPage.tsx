import { useState, type JSX } from 'react';
import { Form } from 'react-router';

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
  /** The token, so the thank-you screen can offer the same page again. */
  token: string;
  result?: OwnerLinkActionResult;
};

/**
 * What each option is called to the owner reading it.
 *
 * Fuller than the club's own shorthand ("Postitus", "Nouto varastolta"): this
 * is read once, on a phone, by someone who has not seen the admin pages. The
 * collection option deliberately promises no address — whether the page hands
 * one out is still an open question, and the club may prefer to agree it by
 * message.
 */
const OWNER_LABELS: Record<HandoverMethodValue, string> = {
  [HandoverMethod.ByMail]: 'Postita kiekko minulle',
  [HandoverMethod.PickedUpFromHome]: 'Noudan kiekon – sovitaan noudosta erikseen',
  [HandoverMethod.PickedUpFromStorage]: 'Noudan kiekon seuran varastolta',
};

export default function OwnerLinkPage({ disc, token, result }: Props): JSX.Element {
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
  const isPosting = wantsItBack && handoverMethod === HandoverMethod.ByMail;

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
        Kerro, haluatko kiekon takaisin. Vastaus menee suoraan seuran löytökiekkovastaavalle.
      </p>

      {result && 'error' in result && <p className="mb-6 text-red-600">{result.error}</p>}

      <Form method="post">
        <fieldset className="mb-6">
          <legend className="mb-2 font-bold">Haluatko kiekon takaisin?</legend>

          <Choice
            name="choice"
            value={OwnerChoice.WantsItBack}
            checked={wantsItBack}
            onChange={setChoice}
            label="Kyllä, haluan kiekon takaisin"
          />
          <Choice
            name="choice"
            value={OwnerChoice.GivesUp}
            checked={choice === OwnerChoice.GivesUp}
            onChange={setChoice}
            label="Ei, seura saa pitää kiekon"
          />
        </fieldset>

        {wantsItBack && (
          <fieldset className="mb-6">
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
              />
            ))}
          </fieldset>
        )}

        {isPosting && (
          <div className="mb-6">
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
        )}

        <Button variant="contained" size="large" type="submit" fullWidth disabled={choice === null}>
          Lähetä vastaus
        </Button>
      </Form>
    </div>
  );
}

type ChoiceProps<V extends number> = {
  name: string;
  value: V;
  checked: boolean;
  onChange: (value: V) => void;
  label: string;
};

/**
 * One radio, with its whole row as the target.
 *
 * Read on a phone, often outdoors, so the tappable area is the label rather
 * than the twelve pixels of the control.
 */
function Choice<V extends number>({ name, value, checked, onChange, label }: ChoiceProps<V>): JSX.Element {
  return (
    <label className="mb-2 flex items-center gap-3 rounded border border-gray-300 px-4 py-3 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span>{label}</span>
    </label>
  );
}

function Centered({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">{children}</div>;
}
