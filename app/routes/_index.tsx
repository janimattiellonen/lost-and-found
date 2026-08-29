import { useEffect, useMemo, useState, type JSX } from 'react';
import { useFetcher } from 'react-router';
import debounce from 'lodash.debounce';

import H2 from '~/routes/components/H2';
import Button from '~/routes/components/Button';
import Collapse from '~/routes/components/Collapse';
import Paper from '~/routes/components/Paper';
import InfoBox from '~/routes/components/InfoBox';
import EmptyingLogItem from '~/routes/components/EmptyingLogItem';
import { WarningIcon } from '~/routes/components/icons';
import CircularProgress from '~/routes/components/CircularProgress';

import DiscTable from '~/routes/DiscTable';
import type { DiscDTO, EmptyingLogDTO } from '~/types';
import DiscSelector from '~/routes/DiscSelector';
import NumberSearch from '~/routes/components/NumberSearch';

export default function TestPage(): JSX.Element {
  const fetcher = useFetcher();

  const [isInfoBoxVisible, showInfoBox] = useState<boolean>(false);
  const [emptyingLogItems, setEmptyingLogItems] = useState<EmptyingLogDTO[]>([]);
  const [discTerm, setDiscTerm] = useState<string | null>('');
  const [phoneNumberTerm, setPhoneNumberTerm] = useState<string | null>('');

  const [clubId, setClubId] = useState<number | null>(null);

  const [distinctDiscNames, setDistinctDiscNames] = useState<string[]>([]);

  const changeHandler = (e: any): void => {
    if (e.target.value.length > 2) {
      setPhoneNumberTerm(e.target.value);
    } else {
      setPhoneNumberTerm(null);
    }
  };

  const debouncedHandler = useMemo(() => {
    return debounce(changeHandler, 300);
  }, []);

  // Derived rather than kept in state: a reload after a delete then cannot lose
  // the filters the way a separate copy of the list would.
  const discs = useMemo<DiscDTO[]>(() => {
    let filtered: DiscDTO[] = fetcher.data?.data ?? [];

    if (discTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.discName === discTerm);
    }

    if (phoneNumberTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.ownerPhoneNumber?.endsWith(phoneNumberTerm));
    }

    return filtered;
  }, [fetcher.data, discTerm, phoneNumberTerm]);

  useEffect(() => {
    fetcher.load('/discs/data');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fetcher.data?.clubId) {
      setClubId(fetcher.data?.clubId);
    }

    if (fetcher.data?.distinctDiscNames) {
      setDistinctDiscNames(fetcher.data?.distinctDiscNames);
    }

    if (fetcher.data?.emptyingLogItems) {
      setEmptyingLogItems(fetcher.data?.emptyingLogItems);
    }
  }, [fetcher.data]);

  const hasDiscs = discs.length > 0;
  // A reload keeps the previous fetcher.data, so "loading with data already on
  // screen" is what separates a refresh from the very first load.
  const isReloading = fetcher.state !== 'idle' && fetcher.data != null;
  const isFirstLoad = fetcher.state !== 'idle' && fetcher.data == null;

  return (
    <div>
      {clubId === 2 && (
        <div className="mt-8 max-w-4xl">
          <p>
            Tällä sivulla luetellaan vain palauttamattomat kiekot, jotka ovat edelleen seuran hallussa. Kiekon tila
            (onko palautettu/myyty/lahjoitettu) saattaa olla virheellinen, jolloin listalla voi näkyä kiekko, joka ei
            enää ole seuralla.
          </p>

          <p>Jos kiekosta löytyy selkeästi luettava puhelinnumero, lähetetään siihen viestiä kiekon löytymisestä.</p>

          <p>
            Jos olet hakenut kopilta kiekkosi, jonka löytymisestä sait viestin puhelinnumerosta, joka päättyy{' '}
            <b>3904</b>, vastaa viestiin "Kiekko haettu".
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
      )}
      <div className="mt-8">
        {emptyingLogItems.length > 0 && (
          <div>
            <H2 className="mb-4">Löytökiekot tarkistettu viimeksi</H2>
            {emptyingLogItems.map((item: EmptyingLogDTO) => {
              return (
                <div key={item.id}>
                  <EmptyingLogItem item={item} showCourseName={emptyingLogItems.length > 1} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-8">
        <div className="flex gap-4 items-end">
          <DiscSelector
            discNames={distinctDiscNames}
            onChange={(selectedItem: string | null) => {
              setDiscTerm(selectedItem);
            }}
          />

          <NumberSearch onChange={debouncedHandler} />

          <Button variant="contained" type="submit" onClick={() => showInfoBox(!isInfoBoxVisible)}>
            Ohjeet
          </Button>
        </div>

        <div className="mt-4 mb-4">
          {
            <Collapse in={isInfoBoxVisible}>
              <Paper elevation={3} children={<InfoBox onClose={() => showInfoBox(false)} />} />
            </Collapse>
          }
        </div>
        {/* The table stays mounted while the list is reloading after a delete
            or a mark: unmounting it looked like a page reload, and it threw
            away the sort order, which lives inside DiscTable. The spinner is
            for the first load only, when there is nothing to show yet. */}
        {hasDiscs && (
          <div aria-busy={isReloading} className={isReloading ? 'opacity-50 transition-opacity' : undefined}>
            <DiscTable discs={discs} onChanged={() => fetcher.load('/discs/data')} />
          </div>
        )}
        {isFirstLoad && <CircularProgress style={{ width: '5rem', height: '5rem' }} />}
      </div>
    </div>
  );
}
