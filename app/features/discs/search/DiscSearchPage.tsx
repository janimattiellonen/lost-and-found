import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';
import { Link, useLocation, useNavigate, useNavigation } from 'react-router';

import { MAX_FIELD_LENGTH } from '~/discFieldLimits';
import { editDiscPath } from '~/features/discs/edit/returnTo';
import { MAX_RESULTS, readDiscSearch, toSearchParams } from '~/features/discs/search/discSearch';
import { discStatusLines } from '~/features/discs/search/discStatus';
import type { DiscSearchPageData } from '~/features/discs/search/loadDiscSearchPage.server';
import type { FoundDisc } from '~/features/discs/search/queryDiscSearch.server';
import { formatPhoneNumber } from '~/phoneNumber';
import { color, font, space } from '~/styles/tokens.stylex';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import TextField from '~/ui/TextField';
import { formatDate } from '~/utils';

/** How long typing has to pause before the page searches; the front page's wait too. */
const SEARCH_DELAY_MS = 300;

/**
 * "Kaikki kiekot": every disc of the club, whatever became of it, found by
 * phone number or disc name. Empty until the admin searches.
 *
 * A search is a navigation to this page with the search in the address, so the
 * loader does the finding, a reload repeats it, and the back button from the
 * edit page comes back to it. Each one replaces the history entry rather than
 * adding one, or the back button would step through every pause in typing.
 */
export default function DiscSearchPage({ search, results, truncated, showCourse }: DiscSearchPageData): JSX.Element {
  const [phone, setPhone] = useState(search?.phone ?? '');
  const [discName, setDiscName] = useState(search?.disc ?? '');

  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();

  // The query string this page last put in the address, or found there. A
  // scheduled search runs after the render that scheduled it, so it reads this
  // rather than a location captured in a stale closure.
  const shownSearch = useRef(location.search);
  const pendingSearch = useRef<ReturnType<typeof setTimeout>>(undefined);

  const runSearch = (phoneValue: string, discValue: string): void => {
    const query = toSearchParams(readDiscSearch({ phone: phoneValue, disc: discValue })).toString();
    const target = query ? `?${query}` : '';

    // A space, a dash, or a first letter in an empty field changes nothing the
    // search uses, so there is nothing to fetch.
    if (target === shownSearch.current) {
      return;
    }

    shownSearch.current = target;
    navigate({ search: target }, { replace: true });
  };

  // Each keypress starts the wait again, so a whole number typed in one go is
  // one search, not one per digit.
  const searchSoon = (phoneValue: string, discValue: string): void => {
    clearTimeout(pendingSearch.current);
    pendingSearch.current = setTimeout(() => runSearch(phoneValue, discValue), SEARCH_DELAY_MS);
  };

  useEffect(() => () => clearTimeout(pendingSearch.current), []);

  // The address changed without this page asking — the menu link, or the
  // browser's back and forward buttons — so the fields follow it rather than
  // keep describing a search that is no longer on screen.
  useEffect(() => {
    if (location.search === shownSearch.current) {
      return;
    }

    shownSearch.current = location.search;
    clearTimeout(pendingSearch.current);
    setPhone(search?.phone ?? '');
    setDiscName(search?.disc ?? '');
  }, [location.search, search]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    clearTimeout(pendingSearch.current);
    runSearch(phone, discName);
  };

  const isSearching = navigation.state === 'loading' && navigation.location.pathname === location.pathname;
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div>
      <H2 className="mt-8 mb-4">Kaikki kiekot</H2>

      {/* A plain GET form: without JavaScript, Enter still submits the two
          fields to this page and the loader reads them the same way. */}
      <form method="get" role="search" onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <Label htmlFor="phone">Puhelinnumero</Label>
          <TextField
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            inputProps={{ maxLength: MAX_FIELD_LENGTH, autoComplete: 'off' }}
            onChange={(event) => {
              setPhone(event.target.value);
              searchSoon(event.target.value, discName);
            }}
          />
        </div>

        <div>
          <Label htmlFor="disc">Kiekko</Label>
          <TextField
            id="disc"
            name="disc"
            value={discName}
            inputProps={{ maxLength: MAX_FIELD_LENGTH, autoComplete: 'off' }}
            onChange={(event) => {
              setDiscName(event.target.value);
              searchSoon(phone, event.target.value);
            }}
          />
        </div>

        {/* A form with two text fields is submitted on Enter only if it has a
            submit button, so it has one — hidden, because the page searches as
            the admin types and a visible button would suggest it does not. Out
            of the Tab order for the same reason; a screen reader still finds
            it. */}
        <button type="submit" tabIndex={-1} {...stylex.props(styles.srOnly)}>
          Hae
        </button>
      </form>

      {/* Nothing at all until something has been searched: no table, and no
          "nothing found" either, because nothing has been looked for. */}
      {results !== null && (
        <div aria-busy={isSearching} className={isSearching ? 'mt-6 opacity-50 transition-opacity' : 'mt-6'}>
          {results.length === 0 ? (
            <p>Hakuehdoilla ei löytynyt kiekkoja.</p>
          ) : (
            <>
              {truncated && <p className="mb-4">Näytetään {MAX_RESULTS} uusinta. Tarkenna hakua.</p>}

              <ResultsTable discs={results} showCourse={showCourse} returnTo={returnTo} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

type ResultsTableProps = {
  discs: FoundDisc[];
  showCourse: boolean;
  /** This page with its search, for the edit page's "Peru" to come back to. */
  returnTo: string;
};

function ResultsTable({ discs, showCourse, returnTo }: ResultsTableProps): JSX.Element {
  return (
    <div {...stylex.props(styles.tableWrap)}>
      <table {...stylex.props(styles.table)}>
        <thead>
          <tr>
            <th scope="col" {...stylex.props(styles.th)}>
              Lisätty
            </th>
            <th scope="col" {...stylex.props(styles.th)}>
              Kiekko
            </th>
            <th scope="col" {...stylex.props(styles.th)}>
              Väri
            </th>
            <th scope="col" {...stylex.props(styles.th)}>
              Omistaja
            </th>
            <th scope="col" {...stylex.props(styles.th)}>
              Puhelin
            </th>
            {showCourse && (
              <th scope="col" {...stylex.props(styles.th)}>
                Rata
              </th>
            )}
            <th scope="col" {...stylex.props(styles.th)}>
              Tila
            </th>
            <th scope="col" {...stylex.props(styles.th)}>
              <span {...stylex.props(styles.srOnly)}>Toiminnot</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {discs.map((disc) => (
            <tr key={disc.externalId}>
              <td {...stylex.props(styles.td, styles.noWrap)}>{formatDate(disc.addedAt)}</td>
              <td {...stylex.props(styles.td)}>{disc.discName}</td>
              <td {...stylex.props(styles.td)}>{disc.discColour}</td>
              <td {...stylex.props(styles.td)}>{disc.ownerName}</td>
              <td {...stylex.props(styles.td, styles.noWrap)}>{formatPhoneNumber(disc.ownerPhoneNumber)}</td>
              {showCourse && <td {...stylex.props(styles.td)}>{disc.course}</td>}
              <td {...stylex.props(styles.td)}>
                {discStatusLines(disc).map((line) => (
                  <div key={line.label}>
                    {line.label}
                    {line.date && <span {...stylex.props(styles.date)}> {formatDate(line.date)}</span>}
                  </div>
                ))}
              </td>
              <td {...stylex.props(styles.td)}>
                <Link
                  to={editDiscPath(disc.externalId, returnTo)}
                  aria-label={`Muokkaa kiekon ${disc.discName} tietoja`}
                  {...stylex.props(styles.link)}
                >
                  Muokkaa
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = stylex.create({
  // The table can outgrow a phone's width; let it scroll on its own.
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: font.sizeSm },
  th: {
    padding: space.sm,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontWeight: font.weightBold,
    color: color.textSecondary,
    backgroundColor: color.surfaceMuted,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
  },
  td: {
    padding: space.sm,
    verticalAlign: 'top',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
  },
  // A date or a number broken over two lines reads as two values.
  noWrap: { whiteSpace: 'nowrap' },
  date: { color: color.textMuted, whiteSpace: 'nowrap' },
  link: { color: color.accent, textDecoration: 'underline' },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});
