import { useEffect, useState } from "react";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { DiscDTO } from "~/types";

import { getDiscs } from "~/models/discs.server";
import { getDistinctDiscNames } from "~/routes/utils";

import DiscSelector from "~/routes/DiscSelector";

import DiscTable from "~/routes/DiscTable";

export const loader = async () => {
  const clubId =  process.env.APP_CLUB_ID!

  const data = await getDiscs();

  const distinctDiscNames = getDistinctDiscNames(data);

  return json({ clubId: parseInt(clubId, 10), data, distinctDiscNames });
};
export default function IndexPage(): JSX.Element {

  const { clubId, data, distinctDiscNames } = useLoaderData();

  const [discs, setDiscs] = useState<DiscDTO[]>([]);

  useEffect(() => {
    setDiscs(data);
  }, [data]);

  return (
    <>
      {clubId === 2 && <div className="mt-8 max-w-4xl">
      <p>Tällä sivulla luetellaan vain palauttamattomat kiekot, jotka ovat edelleen seuran hallussa. Kiekon tila (onko palautettu/myyty/lahjoitettu) saattaa olla virheellinen, jolloin listalla voi näkyä kiekko, joka ei enää ole seuralla.</p>

      <p>Jos kiekosta löytyy selkeästi luettava puhelinnumero, lähetetään siihen viestiä kiekon löytymisestä.</p>

      <p>Jos olet hakenut kopilta kiekkosi, jonka löytymisestä sait viestin puhelinnumerosta, joka päättyy <b>3904</b>, vastaa viestiin "Kiekko haettu".</p>

      <p>Tarkemmat tiedot seuran <a href="https://www.tallaajat.org/loytokiekot/">löytökiekoista</a>.</p>

      <p>Vinkki: taulukon otsikoita painamalla voit järjestää sisällön halutulla tavalla.</p>
    </div>}

    <div className="mt-8">
      <DiscSelector
        discNames={distinctDiscNames}
        onChange={(selectedItem: string | null) => {
          if (selectedItem == null) {
            setDiscs(data);
            return;
          }

          const filtered = data.filter(
            (disc: DiscDTO) => disc.discName === selectedItem
          );

          setDiscs(filtered);
        }}
      />

      <DiscTable discs={discs} />
    </div>
    </>
  );
}
