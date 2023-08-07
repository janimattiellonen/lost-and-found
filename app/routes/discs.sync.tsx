import {ActionArgs, json, LoaderArgs, redirect} from "@remix-run/node";


import {fetchClubs} from "~/models/clubs.server";
import {useLoaderData} from "@remix-run/react";

import SyncItem from "~/routes/discs.syncItem";
import {ClubDTO} from "~/types";

import {syncAllDiscs, syncNewDiscs} from "~/models/syncDiscs.server";


import {getUserData, isAuthenticated} from "~/auth";

import {isUserLoggedIn} from "~/models/utils";

export const loader = async ({request}: LoaderArgs) => {


  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect("/sign-in");
  }

  const data = await fetchClubs();
  return json({data})
}


export async function action({ request }: ActionArgs) {
  const body = await request.formData();

  const clubId = body.get('clubId')

  const allData = body.get('all');
  const newData = body.get('new');

  // console.info(`all: ${allData}, new: ${newData}`);

  if (allData) {
    await syncAllDiscs(parseInt(clubId ? clubId.toString() : '', 10), request);
  } else if (newData) {
    await syncNewDiscs(parseInt(clubId ? clubId.toString() : '', 10), request);
  }

  return null;
}

export default function SyncPage(): JSX.Element {
  const {data} = useLoaderData()

  // console.info(`data: ${JSON.stringify(data,null,2)}`)

  return (
    <div className="mt-4">
    {data.map( (club: ClubDTO) => {
      return <form key={club.id} method="post" action="/discs/sync"><SyncItem club={club} /></form>
    })}
    </div>)

}
