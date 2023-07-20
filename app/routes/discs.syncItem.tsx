import { format, parse } from "date-fns";

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
    <div>
      <form method="post" action="/discs/sync">
        {club.id}: {club.name} ({formatDate(club.updatedAt)})
        <input type="hidden" name="clubId" value={club.id} />{" "}
        <input name="all" type="submit" value={`Sync ALL ${club.name} data`} />{" "}
        <input name="new" type="submit" value={`Sync NEW ${club.name} data`} />
      </form>
    </div>
  );
}
