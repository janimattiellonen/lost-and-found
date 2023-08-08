import Button from '@mui/material/Button';

import { ClubDTO } from "~/types";

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
