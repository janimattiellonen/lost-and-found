import * as stylex from '@stylexjs/stylex';

import { font, space } from '~/styles/tokens.stylex';

const styles = stylex.create({
  heading: {
    fontWeight: font.weightBold,
    fontSize: {
      default: font.sizeMd,
      '@media (min-width: 600px)': font.sizeLg,
    },
  },
  ul: {
    marginBottom: space.md,
  },
  li: {
    listStyle: 'disc',
    marginLeft: space.md,
  },
  // Replaces the MUI CloseIcon: a bare icon button (also fixes the previous
  // keyboard-inaccessible clickable icon).
  closeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
    border: 'none',
    background: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
});

type InfoBoxProps = {
  onClose: () => void;
};
export default function InfoBox({ onClose }: InfoBoxProps): JSX.Element {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 {...stylex.props(styles.heading)}>Ohjeet</h2>
        <button type="button" onClick={onClose} aria-label="Sulje" {...stylex.props(styles.closeButton)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
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
      <ul {...stylex.props(styles.ul)}>
        <li {...stylex.props(styles.li)}>nimi</li>
        <li {...stylex.props(styles.li)}>väri</li>
        <li {...stylex.props(styles.li)}>muovi</li>
        <li {...stylex.props(styles.li)}>kiekosta mahdollisesti löytyvä nimi ja puhelinnumero</li>
        <li {...stylex.props(styles.li)}>paino</li>
        <li {...stylex.props(styles.li)}>stämpin väri</li>
        <li {...stylex.props(styles.li)}>onko ns. spessu (Nate Sexton Firebird, Cloud Breaker, Doom Bird etc)</li>
      </ul>
      <p>
        Jos kiekosta puuttuu nimi ja puhelinnumero ja kyseessä ns stockikiekko (perus kaupan hyllystä löytyvä
        normikiekko), ovat mahdollisuudet saada kiekko takaisin heikot, ellet tarkkaan tiedä kiekon väriä, muovia,
        painoa ja stämpin väriä.
      </p>
      <p>
        Nimettömän spessukiekkojen takaisin saanti on hieman helpompaa, jos vain osaat kuvaille stämpin ja muut
        yksityiskohdat.
      </p>
      <p>
        Haettuasi kiekon kopilta, vastaa tekstiviestiin “Kiekko haettu”, mikäli viesti löydetystä kiekosta on tullut
        puhelinnumerosta, jonka 4 viimeistä numeroa ovat 3904. Tällöin voimme poistaa kiekkosi listalta, eikä se näy
        siellä enää virheellisesti.
      </p>

      <p>
        Emme julkaise tällä sivustolla omistajan koko nimeä, koko puhelinnumeroa, PDGA-numeroa, tai muita omistajaa
        yksilöiviä tietoja, emmekä myöskään spessu-kiekon yksityiskohtia.
      </p>

      <p className="font-bold text-lg">
        Tiedustelut sähköpostitse osoitteeseen{' '}
        <a href="mailto:janimatti.ellonen@gmail.com">janimatti.ellonen@gmail.com</a>.
      </p>
    </div>
  );
}
