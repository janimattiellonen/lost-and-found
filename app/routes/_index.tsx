import { useEffect, useState } from "react";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { DiscDTO } from "~/types";

import { getDiscs } from "~/models/discs.server";
import { getDistinctDiscNames } from "~/routes/utils";

import DiscSelector from "~/routes/DiscSelector";

import DiscTable from "~/routes/DiscTable";

export const loader = async () => {
  const data = await getDiscs();

  const distinctDiscNames = getDistinctDiscNames(data);

  return json({ data, distinctDiscNames });
};
export default function IndexPage(): JSX.Element {
  const { data, distinctDiscNames } = useLoaderData();

  const [discs, setDiscs] = useState<DiscDTO[]>([]);

  useEffect(() => {
    setDiscs(data);
  }, [data]);

  return (
    <div className="mt-8">
      <DiscSelector
        discNames={distinctDiscNames}
        onChange={(selectedItem: string | null) => {
          console.log(`DD: ${JSON.stringify(selectedItem,null,2)}`)
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
  );
}
