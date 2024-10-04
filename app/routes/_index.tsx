import { useEffect, useMemo, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import debounce from 'lodash.debounce';

import styled from '@emotion/styled';

import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import InfoBox from '~/routes/components/InfoBox';
import EmptyingLogItem from '~/routes/components/EmptyingLogItem';
import WarningIcon from '@mui/icons-material/Warning';
import CircularProgress from '@mui/material/CircularProgress';

import DiscTable from '~/routes/DiscTable';
import { DiscDTO, EmptyingLogDTO } from '~/types';
import DiscSelector from '~/routes/DiscSelector';
import NumberSearch from '~/routes/components/NumberSearch';

const H2 = styled.h2`
  font-weight: bold;

  font-size: 1.25rem;

  @media (min-width: 600px) {
    font-size: 1.75rem;
  }
`;

const StyledWarningIcon = styled(WarningIcon)`
  color: red;
  margin-right: 0.5rem;
`;

export default function TestPage(): JSX.Element {
  const fetcher = useFetcher();

  const [isInfoBoxVisible, showInfoBox] = useState<boolean>(false);
  const [discs, setDiscs] = useState<DiscDTO[]>([]);
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

  useEffect(() => {
    fetcher.load('/foo');
  }, []);

  useEffect(() => {
    if (fetcher.data?.clubId) {
      setClubId(fetcher.data?.clubId);
    }

    if (fetcher.data?.data) {
      setDiscs(fetcher.data?.data);
    }

    if (fetcher.data?.distinctDiscNames) {
      setDistinctDiscNames(fetcher.data?.distinctDiscNames);
    }

    if (fetcher.data?.emptyingLogItems) {
      setEmptyingLogItems(fetcher.data?.emptyingLogItems);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (discTerm == null && phoneNumberTerm == null) {
      setDiscs(fetcher.data?.data || []);
      return;
    }

    let filtered = fetcher.data?.data || [];

    if (discTerm) {
      filtered = fetcher.data?.data.filter((disc: DiscDTO) => disc.discName === discTerm);
    }

    if (phoneNumberTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.ownerPhoneNumber?.endsWith(phoneNumberTerm));
    }

    setDiscs(filtered);
  }, [discTerm, phoneNumberTerm]);

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
            <StyledWarningIcon
              titleAccess={'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa'}
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
        <div className="flex gap-4">
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
              <Paper elevation={3} children={<InfoBox clubId={clubId || 0} onClose={() => showInfoBox(false)} />} />
            </Collapse>
          }
        </div>
        {fetcher.data?.data?.length > 0 && fetcher.state === 'idle' && <DiscTable clubId={clubId || 0} discs={discs} />}
        {fetcher.state !== 'idle' && <CircularProgress style={{ width: '5rem', height: '5rem' }} />}
      </div>
    </div>
  );
}
