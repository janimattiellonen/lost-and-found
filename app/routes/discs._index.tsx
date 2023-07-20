import { useEffect, useState } from "react";
import styled from "@emotion/styled";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { DiscDTO } from "~/types";

import { getDiscs, getDiscNames } from "~/models/discs.server";
import { getDistinctDiscNames } from "~/routes/utils";

import DiscSelector from "~/routes/DiscSelector";

import DiscTable from "~/routes/DiscTable";

const H1 = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
`;

export const loader = async () => {
  const data = await getDiscs();

  const distinctDiscNames = getDistinctDiscNames(data);

  return json({ data, distinctDiscNames });
};
export default function DiscsPage(): JSX.Element {
  const { data, distinctDiscNames } = useLoaderData();

  const [discs, setDiscs] = useState<DiscDTO[]>([]);

  useEffect(() => {
    setDiscs(data);
  }, [data]);

  return (
    <div>
      <H1>Discs</H1>
      <DiscSelector
        discNames={distinctDiscNames}
        onChange={(e) => {
          if (e.target.value == -1) {
            setDiscs(data);
            return;
          }

          console.log(e.target.value);
          console.log(`LENGTH: ${discs.length}`);

          const filtered = data.filter(
            (disc: DiscDTO) => disc.discName === e.target.value
          );

          setDiscs(filtered);
        }}
      />

      <DiscTable discs={discs} />
    </div>
  );
}
