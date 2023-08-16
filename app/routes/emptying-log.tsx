import {ActionArgs, json, LoaderArgs} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import styled from "@emotion/styled";

import {getEmptyingLogItems, markAsEmptied} from "~/models/emptyingLog.server";
import {EmptyingLogDTO} from "~/types";

import EmptyingLogItem from "~/routes/components/admin/EmptyingLogItem";

const H2 = styled.h2`
  font-weight: bold;

  font-size: 1.25rem;

  @media (min-width: 600px) {
    font-size: 1.75rem;
  }
`;

export const loader = async ({request}: LoaderArgs) => {
  const emptyingLogItems = await getEmptyingLogItems(request)

  return json({emptyingLogItems})
}

export async function action({ request }: ActionArgs) {
  const body = await request.formData();

  const item = body.get('item')

  console.log(`action(), item: ${item}`);

  if (item) {
    await markAsEmptied(parseInt(item.toString(), 10), request);
  }

  return json({});
}
export default function EmptyingLogPage(): JSX.Element {
  const { emptyingLogItems } = useLoaderData()

  return <div>
    <H2 className="mt-8 mb-8">Tyhjennysloki</H2>

    {emptyingLogItems.length && emptyingLogItems.map( (item: EmptyingLogDTO) => {
      return <form key={item.id} method="post" action="/emptying-log"><EmptyingLogItem item={item}/></form>
    })}

  </div>
}
