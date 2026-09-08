import type { JSX } from 'react';

import { getClubLostDiscsUrl } from '~/config/clubs';
import { WarningIcon } from '~/ui/icons';

type DiscListIntroProps = {
  clubId: number | null;
};

/**
 * What a club says above its disc list.
 *
 * The text is the same for every club; only the link to the club's own
 * lost-and-found page differs, and it is left out for a club that has none.
 * Nothing renders until the club id has loaded, so the intro does not appear
 * with a missing link and then gain one.
 */
export default function DiscListIntro({ clubId }: DiscListIntroProps): JSX.Element | null {
  if (clubId === null) {
    return null;
  }

  const lostDiscsUrl = getClubLostDiscsUrl(clubId);

  return (
    <div className="mt-8 max-w-4xl">
      <p>
        Seuran hallussa olevat kiekot. Jos kiekosta löytyy selkeästi luettava puhelinnumero, lähetetään siihen viestiä
        kiekon löytymisestä.
      </p>

      <p></p>

      {lostDiscsUrl && (
        <p>
          Tarkemmat tiedot seuran{' '}
          <a href={lostDiscsUrl} target={'_blank'} rel="noreferrer">
            löytökiekoista
          </a>
          .
        </p>
      )}

      <p>
        <WarningIcon
          title={'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa'}
          style={{ display: 'inline', color: 'red', marginRight: '0.5rem' }}
        />
        Yli 3kk seuralla olleet kiekot myydään tai lahjoitetaan.
      </p>
    </div>
  );
}
