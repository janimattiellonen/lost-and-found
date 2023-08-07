import { format, parse } from "date-fns";

import Button from '@mui/material/Button';

import { ClubDTO } from "~/types";
import { ActionArgs } from "@remix-run/node";



type SyncItemProps = {
  club: ClubDTO;
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return "";
  }

  const formattedDate = new Intl.DateTimeFormat("fi-FI").format(
    new Date(dateStr)
  );

  return formattedDate;
}
// 2023-06-19T11:28:40.744772+00:00
//
// parse("19.6.2023", "d.M.y", new Date())
export default function SyncItem({ club }: SyncItemProps): JSX.Element {
  return (
    <div className="mb-4 flex justify-start gap-4 items-center">
        {club.id}: {club.name} ({formatDate(club.updatedAt)})
        <input type="hidden" name="clubId" value={club.id} />{" "}
        <Button variant="contained" name="all" type="submit" value={"all"}>Päivitä KAIKKI {club.name} data</Button>
        <Button variant="contained" name="new" type="submit" value={`new`} >Päivitä UUSI {club.name} data</Button>
    </div>
  );
}
