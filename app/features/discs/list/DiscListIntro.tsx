import type { JSX } from 'react';

import { TALIN_TALLAAJAT } from '~/config/clubs';
import { WarningIcon } from '~/ui/icons';

type DiscListIntroProps = {
  clubId: number | null;
};

/**
 * What a club says above its disc list.
 *
 * Only Talin Tallaajat has written one; every other club (and the moment
 * before the club id has loaded) renders nothing. A second club's intro goes
 * here as another branch rather than back into the page.
 */
export default function DiscListIntro({ clubId }: DiscListIntroProps): JSX.Element | null {
  if (clubId !== TALIN_TALLAAJAT) {
    return null;
  }

  return (
    <div className="mt-8 max-w-4xl">
      <p>
        Tällä sivulla luetellaan vain palauttamattomat kiekot, jotka ovat edelleen seuran hallussa. Kiekon tila (onko
        palautettu/myyty/lahjoitettu) saattaa olla virheellinen, jolloin listalla voi näkyä kiekko, joka ei enää ole
        seuralla.
      </p>

      <p>Jos kiekosta löytyy selkeästi luettava puhelinnumero, lähetetään siihen viestiä kiekon löytymisestä.</p>

      <p>
        Jos olet hakenut kopilta kiekkosi, jonka löytymisestä sait viestin puhelinnumerosta, joka päättyy <b>3904</b>,
        vastaa viestiin "Kiekko haettu".
      </p>

      <p>
        Tarkemmat tiedot seuran <a href="https://www.tallaajat.org/loytokiekot/">löytökiekoista</a>.
      </p>

      <p>Vinkki: taulukon otsikoita painamalla voit järjestää sisällön halutulla tavalla.</p>

      <p>
        <WarningIcon
          title={'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa'}
          style={{ color: 'red', marginRight: '0.5rem' }}
        />
        Jos lisäyspäivämäärän jälkeen näkyy kyseinen kuvake, on kiekko ollut seuran hallussa yli 3kk ja se saatetaan
        pian myydä tai lahjoittaa.
      </p>
    </div>
  );
}
