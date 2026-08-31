import type { DiscDTO } from '~/types';
import { format, parse } from 'date-fns';
import process from 'process';

function isEmpty(str?: string | null): boolean {
  return !str || str.length === 0;
}

/**
 * A dd/MM/y date from the sheet as y-MM-dd, or null when the cell holds
 * something else. One row currently reads "9248", and throwing on it took the
 * whole import down; callers can now skip or report the row instead.
 */
export function parseSheetDate(value?: string | null): string | null {
  if (isEmpty(value)) {
    return null;
  }

  const parsed = parse(value!, 'dd/MM/y', new Date());

  return isNaN(parsed.getTime()) ? null : format(parsed, 'y-MM-dd');
}

const indexes = {
  DISC_NAME: 0,
  DISC_MANUFACTURER: 1,
  DISC_COLOUR: 2,
  OWNER_NAME: 3,
  OWNER_PHONE_NUMBER: 4,
  ADDED_AT: 5,
  IS_RETURNED_TO_OWNER: 10,
  CAN_BE_SOLD_OR_DONATED: 11,
  ADDITIONAL_INFO: 12,
  COURSE: 13,
  INTERNAL_DISC_ID: 14,
};
// Kiekko	Valmistaja	Väri	Nimi	Puhelinnumero	Lisätty		Kirjaaja	Puh. Nro	email	Palautettu	Ei halua takaisin	Muuta	Rata Id

export async function importDiscData(): Promise<DiscDTO[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/1dyROkBCcHPySBqnB093Pmcvv0Wp4oAFw7PnhHa0GBD0/values/Oittaa?valueRenderOption=FORMATTED_VALUE&key=${process.env.PUSKASOTURIT_SHEETS_KEY}`;

  const PUSKASOTURIT_ID = 1;

  const res = await fetch(url);

  const data = await res.json();

  // Without this, an API error (a rejected key, say) surfaces further down as
  // "Cannot read properties of undefined", which says nothing about the cause.
  if (!data.values) {
    throw new Error(`Reading the Puskasoturit sheet failed: ${data.error?.message ?? JSON.stringify(data)}`);
  }

  const {
    DISC_NAME,
    DISC_MANUFACTURER,
    OWNER_NAME,
    DISC_COLOUR,
    OWNER_PHONE_NUMBER,
    ADDED_AT,
    IS_RETURNED_TO_OWNER,
    CAN_BE_SOLD_OR_DONATED,
    ADDITIONAL_INFO,
    COURSE,
    INTERNAL_DISC_ID,
  } = indexes;

  const filteredValues = data.values
    .slice(1)
    .filter((item: any) => item[INTERNAL_DISC_ID] !== '' && !isEmpty(item[DISC_NAME]) && !isEmpty(item[ADDED_AT]));

  const discs: DiscDTO[] = filteredValues.map((item: any) => {
    return {
      discName: item[DISC_NAME],
      discManufacturer: item[DISC_MANUFACTURER],
      discColour: item[DISC_COLOUR],
      ownerName: item[OWNER_NAME],
      ownerPhoneNumber: item[OWNER_PHONE_NUMBER],
      additionalInfo: item[ADDITIONAL_INFO],
      //addedAt: '2023-02-023',
      addedAt: parseSheetDate(item[ADDED_AT]),
      isReturnedToOwner: !isEmpty(item[IS_RETURNED_TO_OWNER]) ? true : false,
      returnedToOwnerText: item[IS_RETURNED_TO_OWNER],
      canBeSoldOrDonated: !isEmpty(item[CAN_BE_SOLD_OR_DONATED]) ? true : false,
      canBeSoldOrDonatedText: item[CAN_BE_SOLD_OR_DONATED],
      course: item[COURSE],
      internalDiscId: item[INTERNAL_DISC_ID],
      clubId: PUSKASOTURIT_ID,
    };
  });

  return discs;
}
