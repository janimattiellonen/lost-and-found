import { useEffect, useMemo, useState, type JSX } from 'react';
import { useFetcher } from 'react-router';

import * as stylex from '@stylexjs/stylex';
import { add, isAfter } from 'date-fns';

import DiscSelector from '~/routes/DiscSelector';
import { WarningIcon } from '~/routes/components/icons';
import { color, radius, space, font } from '~/styles/tokens.stylex';
import type { DiscDTO } from '~/types';

// ---------------------------------------------------------------------------
// Mobile-first search (/index2).
//
// Loads the real disc list from the shared `/discs/data` loader (same source as
// the main page) and filters it client-side.
//
// Search model: one field that accepts EITHER a phone number OR a disc name.
//  - A value that looks like a phone number filters on the last 4 digits.
//  - Anything else is a case-insensitive disc-name substring match.
// "Lisää hakuehtoja" reveals the DiscSelector combobox (exact match against the
// list of known disc names, same as the main page); "Näytä ohjeet" reveals the
// wall of text that currently sits at the top of the main page.
// ---------------------------------------------------------------------------

export default function Index2Page(): JSX.Element {
  const fetcher = useFetcher();

  const [query, setQuery] = useState('');
  const [selectedDiscName, setSelectedDiscName] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetcher.load('/discs/data');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discs: DiscDTO[] = useMemo(() => fetcher.data?.data ?? [], [fetcher.data]);
  const distinctDiscNames: string[] = useMemo(() => fetcher.data?.distinctDiscNames ?? [], [fetcher.data]);
  const isLoading = fetcher.state !== 'idle';

  const phoneDigits = extractPhoneDigits(query);
  const isPhoneSearch = phoneDigits !== null;
  const last4 = phoneDigits ? phoneDigits.slice(-4) : '';

  const hasSearched = query.trim().length > 0 || selectedDiscName != null;

  const results = useMemo(() => {
    if (!hasSearched) {
      return [];
    }

    return discs.filter((disc) => {
      // Primary field: phone (last 4 digits) or disc-name substring.
      if (query.trim().length > 0) {
        if (isPhoneSearch) {
          if (!disc.ownerPhoneNumber?.endsWith(last4)) {
            return false;
          }
        } else if (!disc.discName.toLowerCase().includes(query.trim().toLowerCase())) {
          return false;
        }
      }

      // DiscSelector filter (revealed via "Lisää hakuehtoja"): exact match
      // against a known disc name, identical to the main page.
      if (selectedDiscName != null && disc.discName !== selectedDiscName) {
        return false;
      }

      return true;
    });
  }, [discs, hasSearched, query, isPhoneSearch, last4, selectedDiscName]);

  return (
    <div {...stylex.props(styles.page)}>
      <h1 {...stylex.props(styles.title)}>Onko kiekkosi löytynyt?</h1>
      <p {...stylex.props(styles.lead)}>Anna puhelinnumerosi 4 viimeistä numeroa tai kiekon nimi.</p>

      <div {...stylex.props(styles.searchBlock)}>
        <label htmlFor="index2-search" {...stylex.props(styles.srOnly)}>
          4 viimeistä numeroa tai kiekon nimi
        </label>
        <input
          id="index2-search"
          inputMode="search"
          autoComplete="off"
          placeholder="4 viimeistä numeroa tai kiekon nimi"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          {...stylex.props(styles.searchInput)}
        />

        {isPhoneSearch && (
          <p {...stylex.props(styles.hint)}>
            Haetaan puhelinnumeron 4 viimeisellä numerolla: <b>{last4}</b>
          </p>
        )}

        <div {...stylex.props(styles.linkRow)}>
          <button type="button" onClick={() => setShowMoreFilters((v) => !v)} {...stylex.props(styles.linkButton)}>
            {showMoreFilters ? 'Piilota hakuehdot' : 'Lisää hakuehtoja…'}
          </button>
          <button type="button" onClick={() => setShowInstructions((v) => !v)} {...stylex.props(styles.linkButton)}>
            {showInstructions ? 'Piilota ohjeet' : 'Näytä ohjeet'}
          </button>
        </div>

        {showMoreFilters && (
          <div {...stylex.props(styles.moreFilters)}>
            <DiscSelector discNames={distinctDiscNames} onChange={setSelectedDiscName} />
          </div>
        )}
      </div>

      {showInstructions && <Instructions onClose={() => setShowInstructions(false)} />}

      <div {...stylex.props(styles.results)}>
        {isLoading && <p {...stylex.props(styles.placeholderText)}>Ladataan kiekkoja…</p>}

        {!isLoading && hasSearched && results.length === 0 && (
          <p {...stylex.props(styles.placeholderText)}>
            Ei hakutuloksia. Kokeile kiekon nimellä, jos puhelinnumero on voinut tallentua väärin.
          </p>
        )}

        {results.length > 0 && (
          <>
            <p {...stylex.props(styles.resultCount)}>
              {results.length} {results.length === 1 ? 'osuma' : 'osumaa'}
            </p>
            <ul {...stylex.props(styles.cardList)}>
              {results.map((disc) => (
                <li key={disc.internalDiscId}>
                  <DiscCard disc={disc} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

type DiscCardProps = {
  disc: DiscDTO;
};

function DiscCard(props: DiscCardProps): JSX.Element {
  const disc = props.disc;
  const atRisk = disc.addedAt ? isInDangerOfBeingDonatedOrSold(disc.addedAt) : false;

  return (
    <article {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.cardHeader)}>
        <span {...stylex.props(styles.cardName)}>{disc.discName}</span>
        {atRisk && (
          <WarningIcon
            title="Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa"
            style={{ color: color.danger, flexShrink: 0 }}
          />
        )}
      </div>

      <dl {...stylex.props(styles.cardBody)}>
        <Row label="Väri" value={disc.discColour} />
        {disc.discManufacturer && <Row label="Valmistaja" value={disc.discManufacturer} />}
        {disc.ownerName && <Row label="Omistaja" value={disc.ownerName} />}
        {disc.ownerPhoneNumber && <Row label="Puhelin" value={`****${disc.ownerPhoneNumber.slice(-4)}`} />}
        <Row label="Lisätty" value={formatDate(disc.addedAt)} />
      </dl>
    </article>
  );
}

type RowProps = {
  label: string;
  value: string;
};

function Row(props: RowProps): JSX.Element {
  return (
    <div {...stylex.props(styles.row)}>
      <dt {...stylex.props(styles.rowLabel)}>{props.label}</dt>
      <dd {...stylex.props(styles.rowValue)}>{props.value}</dd>
    </div>
  );
}

type InstructionsProps = {
  onClose: () => void;
};

function Instructions(props: InstructionsProps): JSX.Element {
  return (
    <div {...stylex.props(styles.instructions)}>
      <div {...stylex.props(styles.instructionsHeader)}>
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Sulje ohjeet"
          {...stylex.props(styles.instructionsClose)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
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

      <h2 {...stylex.props(styles.instructionsHeading)}>Ohjeet</h2>
      <p>
        Jos kiekosta löytyy puhelinnumero, laitetaan omistajalle tietoa siitä tekstiviestillä. Jos et ole saanut
        viestiä, on todennäköistä, että kiekkoasi ei ole palautettu, tai että kiekosta löytyvä puhelinnumero on sen
        verran epäselvä, että tekstiviestiä ei ole voitu lähettää, tai se on mennyt väärään numeroon.
      </p>
      <p>
        Jos olet sitä mieltä (tai epäilet), että listalta löytyvä kiekko on sinun, laita mahdollisimman tarkat tiedot
        kiekosta:
      </p>
      <ul {...stylex.props(styles.instructionsList)}>
        <li {...stylex.props(styles.instructionsListItem)}>nimi</li>
        <li {...stylex.props(styles.instructionsListItem)}>väri</li>
        <li {...stylex.props(styles.instructionsListItem)}>muovi</li>
        <li {...stylex.props(styles.instructionsListItem)}>kiekosta mahdollisesti löytyvä nimi ja puhelinnumero</li>
        <li {...stylex.props(styles.instructionsListItem)}>paino</li>
        <li {...stylex.props(styles.instructionsListItem)}>stämpin väri</li>
        <li {...stylex.props(styles.instructionsListItem)}>
          onko ns. spessu (Nate Sexton Firebird, Cloud Breaker, Doom Bird etc)
        </li>
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
      <p {...stylex.props(styles.instructionsContact)}>
        Tiedustelut sähköpostitse osoitteeseen{' '}
        <a href="mailto:janimatti.ellonen@gmail.com">janimatti.ellonen@gmail.com</a>.
      </p>
    </div>
  );
}

// --- helpers ---------------------------------------------------------------

// Returns the digits if `value` looks like a phone-number search (digits plus
// the usual separators, at least 4 digits), otherwise null (treat as a name).
function extractPhoneDigits(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!/^[\d\s+()-]+$/.test(trimmed)) {
    return null;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 4 ? digits : null;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return '';
  }
  return new Intl.DateTimeFormat('fi-FI').format(new Date(dateStr));
}

function isInDangerOfBeingDonatedOrSold(dateStr: string): boolean {
  const date = add(new Date(dateStr), { months: 3 });
  return !isAfter(date, new Date());
}

// --- styles ----------------------------------------------------------------

const styles = stylex.create({
  page: {
    maxWidth: '640px',
    marginInline: 'auto',
    paddingInline: space.md,
    paddingBlock: space.lg,
    fontFamily: font.family,
    color: color.textPrimary,
  },
  title: {
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    margin: 0,
  },
  lead: {
    marginTop: space.sm,
    marginBottom: space.lg,
    color: color.textSecondary,
    fontSize: font.sizeMd,
  },
  searchBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    fontFamily: 'inherit',
    fontSize: '1.125rem',
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus': color.accent },
    borderRadius: radius.md,
    outline: 'none',
  },
  hint: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.textMuted,
  },
  linkRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: space.md,
  },
  linkButton: {
    appearance: 'none',
    border: 'none',
    background: 'none',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: font.sizeSm,
    color: color.accent,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  moreFilters: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
    paddingTop: space.xs,
  },
  instructions: {
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: color.surfaceMuted,
    borderRadius: radius.md,
    fontSize: font.sizeSm,
    color: color.textSecondary,
  },
  instructionsHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  instructionsClose: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xs,
    marginTop: `calc(-1 * ${space.xs})`,
    marginRight: `calc(-1 * ${space.xs})`,
    border: 'none',
    background: 'none',
    color: { default: color.textMuted, ':hover': color.textPrimary },
    cursor: 'pointer',
  },
  instructionsHeading: {
    marginTop: space.lg,
    marginBottom: space.sm,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    color: color.textPrimary,
  },
  instructionsList: {
    marginBlock: space.sm,
    paddingInlineStart: space.lg,
    listStyle: 'disc',
  },
  instructionsListItem: {
    marginBottom: space.xs,
  },
  instructionsContact: {
    marginTop: space.md,
    fontWeight: font.weightBold,
  },
  results: {
    marginTop: space.lg,
  },
  placeholderText: {
    color: color.textMuted,
    fontSize: font.sizeMd,
  },
  resultCount: {
    margin: 0,
    marginBottom: space.sm,
    fontWeight: font.weightBold,
    color: color.textSecondary,
  },
  cardList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: space.md,
  },
  card: {
    padding: space.md,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.md,
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginBottom: space.sm,
  },
  cardName: {
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
  },
  cardBody: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
  },
  row: {
    display: 'flex',
    gap: space.sm,
  },
  rowLabel: {
    flexShrink: 0,
    width: '96px',
    margin: 0,
    color: color.textMuted,
    fontSize: font.sizeSm,
  },
  rowValue: {
    margin: 0,
    color: color.textPrimary,
    fontSize: font.sizeSm,
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});
