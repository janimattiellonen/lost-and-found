import { createConnection } from "~/models/utils";
import * as process from "process";

import { DiscDTO } from "~/types";

import { toDTO } from "~/models/DiscMapper";

export async function getDiscs(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  console.log(`CLUB ID: ${clubId}`);

  const supabase = createConnection();

  let { data, error } = await supabase
    .from("discs")
    .select(
      "disc_name, disc_colour, disc_manufacturer, owner_name, owner_phone_number, owner_club_name, added_at"
    )
    .order("disc_name", { ascending: true })
    .eq("is_returned_to_owner", false)
    .eq("can_be_sold_or_donated", false)
    .eq("club_id", clubId);

  console.log(`DATA: ${JSON.stringify(data,null,2)}`)

  return data.map((row: any) => {
    if (row["owner_phone_number"]) {
      row["owner_phone_number"] = row["owner_phone_number"].slice(-4);
    }
    return toDTO(row);
  });
}
