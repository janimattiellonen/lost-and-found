import styled from '@emotion/styled';

import CloseIcon from '@mui/icons-material/Close';

const H3 = styled.h2`
  font-weight: bold;

  font-size: 1rem;

  @media (min-width: 600px) {
    font-size: 1.25rem;
  }
`;

const Ul = styled.ul`
  margin-bottom: 1rem;
`;

const Li = styled.li`
  list-style: disc;
  margin-left: 1rem;
`;

const StyledCloseIcon = styled(CloseIcon)`
  &:hover {
    cursor: pointer;
  }
`;

type InfoBoxProps = {
  clubId?: number;
  onClose: () => void;
};

function getTalinTallaajatEmail(): string {
  return 'janimatti.ellonen@gmail.com';
}

function getPuskasoturitEmail(): string {
  return 'loytokiekot@puskasoturit.com';
}

export default function InfoBox({ clubId, onClose }: InfoBoxProps): JSX.Element {
  const email = clubId === 1 ? getPuskasoturitEmail() : getTalinTallaajatEmail();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <H3>Ohjeet</H3>
        <StyledCloseIcon onClick={onClose} />
      </div>

      <p>
        Jos kiekosta löytyy puhelinnumero, laitetaan omistajalle tietoa siitä tekstiviestillä. Jos et ole saanut
        viestiä, on todennäköistä, että kiekkoasi ei ole palautettu, tai että kiekosta löytyvä puhelinnumero on sen
        verran epäselvä, että tekstiviestiä ei ole voitu lähettää, tai se on mennyt väärään numeroon.
      </p>
      <p>
        Jos olet sitä mieltä (tai epäilet), että listalta löytyvä kiekko on sinun, laita mahdollisimman tarkat tiedot
        kiekosta:
      </p>
      <Ul>
        <Li>nimi</Li>
        <Li>väri</Li>
        <Li>muovi</Li>
        <Li>kiekosta mahdollisesti löytyvä nimi ja puhelinnumero</Li>
        <Li>paino</Li>
        <Li>stämpin väri</Li>
        <Li>onko ns. spessu (Nate Sexton Firebird, Cloud Breaker, Doom Bird etc)</Li>
      </Ul>
      <p>
        Jos kiekosta puuttuu nimi ja puhelinnumero ja kyseessä ns stockikiekko (perus kaupan hyllystä löytyvä
        normikiekko), ovat mahdollisuudet saada kiekko takaisin heikot, ellet tarkkaan tiedä kiekon väriä, muovia,
        painoa ja stämpin väriä.
      </p>
      <p>
        Nimettömän spessukiekkojen takaisin saanti on hieman helpompaa, jos osaat kuvailla stämppiä ja muita
        yksityiskohtia.
      </p>
      {clubId === 2 && (
        <p>
          Haettuasi kiekon kopilta, vastaa tekstiviestiin “Kiekko haettu”, mikäli viesti löydetystä kiekosta on tullut
          puhelinnumerosta, jonka 4 viimeistä numeroa ovat 3904. Tällöin voimme poistaa kiekkosi listalta, eikä se näy
          siellä enää virheellisesti.
        </p>
      )}

      <p>
        Emme julkaise tällä sivustolla omistajan koko nimeä, koko puhelinnumeroa, PDGA-numeroa, tai muita omistajaa
        yksilöiviä tietoja, emmekä myöskään spessu-kiekon yksityiskohtia.
      </p>

      <p className="font-bold text-lg">
        Tiedustelut sähköpostitse osoitteeseen <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </div>
  );
}
