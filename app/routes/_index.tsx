import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';

import styled from '@emotion/styled';

import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Collapse from '@mui/material/Collapse';

import { json, LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { DiscDTO, EmptyingLogDTO } from '~/types';

import { getDiscs } from '~/models/discs.server';
import { getEmptyingLogItemsForClub } from '~/models/emptyingLog.server';
import { getDistinctDiscNames } from '~/routes/utils';

import DiscSelector from '~/routes/DiscSelector';
import NumberSearch from '~/routes/components/NumberSearch';

import DiscTable from '~/routes/DiscTable';
import EmptyingLogItem from '~/routes/components/EmptyingLogItem';

import InfoBox from '~/routes/components/InfoBox';

const H2 = styled.h2`
  font-weight: bold;

  font-size: 1.25rem;

  @media (min-width: 600px) {
    font-size: 1.75rem;
  }
`;

export const loader = async ({ request }: LoaderArgs) => {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  const emptyingLogItems = await getEmptyingLogItemsForClub(clubId, request);

  const data = await getDiscs();

  const distinctDiscNames = getDistinctDiscNames(data);

  return json({ clubId: clubId, data, distinctDiscNames, emptyingLogItems });
};
export default function IndexPage(): JSX.Element {
  const [isInfoBoxVisible, showInfoBox] = useState<boolean>(false);
  const [discTerm, setDiscTerm] = useState<string | null>('');
  const [phoneNumberTerm, setPhoneNumberTerm] = useState<string | null>('');

  const { clubId, data, distinctDiscNames, emptyingLogItems } = useLoaderData();

  const [discs, setDiscs] = useState<DiscDTO[]>([]);

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
    setDiscs(data);
  }, [data]);

  useEffect(() => {
    if (discTerm == null && phoneNumberTerm == null) {
      setDiscs(data);
      return;
    }

    let filtered = data;

    if (discTerm) {
      filtered = data.filter((disc: DiscDTO) => disc.discName === discTerm);
    }

    if (phoneNumberTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.ownerPhoneNumber?.endsWith(phoneNumberTerm));
    }

    setDiscs(filtered);
  }, [discTerm, phoneNumberTerm]);

  return (
    <>
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
              <Paper elevation={3} children={<InfoBox onClose={() => showInfoBox(false)} />} />
            </Collapse>
          }
        </div>
        <DiscTable discs={discs} />
      </div>
    </>
  );
}
