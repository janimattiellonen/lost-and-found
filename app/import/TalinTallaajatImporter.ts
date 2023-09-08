import { format, parse } from 'date-fns';

import { DiscDTO } from '~/types';

function isEmpty(str?: string | null): boolean {
  return !str || str.length === 0;
}

const indexes = {
  INTERNAL_DISC_ID: 0,
  DISC_NAME: 1,
  OWNER_NAME: 2,
  OWNER_PHONE_NUMBER: 3,
  DISC_COLOUR: 5,
  OWNER_CLUB_NAME: 6,
  NOTIFIED_AT: 7,
  ADDITIONAL_INFO: 8,
  ADDED_AT: 9,
  IS_RETURNED_TO_OWNER: 11,
  CAN_BE_SOLD_OR_DONATED: 12,
};
export async function importDiscData(): Promise<DiscDTO[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/1_E4YYH5RfejSL14LB4AVa4wxPJ9djuNbwsGulhevy0s/values/Master?valueRenderOption=FORMATTED_VALUE&key=${process.env.TT_SHEETS_KEY}`;

  const res = await fetch(url);

  const data = await res.json();

  const TALIN_TALLAAJAT_ID = 2;

  const {
    INTERNAL_DISC_ID,
    DISC_NAME,
    OWNER_NAME,
    OWNER_PHONE_NUMBER,
    DISC_COLOUR,
    OWNER_CLUB_NAME,
    NOTIFIED_AT,
    ADDITIONAL_INFO,
    ADDED_AT,
    IS_RETURNED_TO_OWNER,
    CAN_BE_SOLD_OR_DONATED,
  } = indexes;

  const filteredValues = data.values
    .slice(1)
    .filter((item: any) => item[INTERNAL_DISC_ID] !== '' && !isEmpty(item[DISC_NAME]) && !isEmpty(item[ADDED_AT]));

  const discs: DiscDTO[] = filteredValues.map((item: any) => {
    return {
      internalDiscId: item[INTERNAL_DISC_ID],
      discName: item[DISC_NAME],
      discColour: item[DISC_COLOUR],
      ownerName: item[OWNER_NAME],
      ownerPhoneNumber: item[OWNER_PHONE_NUMBER],
      ownerClubName: item[OWNER_CLUB_NAME],
      notifiedAt: item[NOTIFIED_AT],
      additionalInfo: item[ADDITIONAL_INFO],
      addedAt: item[ADDED_AT]
        ? format(parse(item[ADDED_AT] ? item[ADDED_AT] : '', 'd.M.y', new Date()), 'y-MM-dd')
        : null,
      isReturnedToOwner: !isEmpty(item[IS_RETURNED_TO_OWNER]) ? true : false,
      returnedToOwnerText: item[IS_RETURNED_TO_OWNER],
      canBeSoldOrDonated: !isEmpty(item[CAN_BE_SOLD_OR_DONATED]) ? true : false,
      canBeSoldOrDonatedText: item[CAN_BE_SOLD_OR_DONATED],
      clubId: TALIN_TALLAAJAT_ID,
    };
  });

  return discs;
}
