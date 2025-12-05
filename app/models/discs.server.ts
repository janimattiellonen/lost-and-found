import { createConnection } from '~/models/utils';
import * as process from 'process';

import { DiscDTO } from '~/types';

import { toDTO } from '~/models/DiscMapper';

export async function getDiscs(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data, error } = await supabase
    .from('discs')
    .select(
      'internal_disc_id, disc_name, disc_colour, disc_manufacturer, owner_name, owner_phone_number, owner_club_name, added_at',
    )
    .order('disc_name', { ascending: true })
    .eq('is_returned_to_owner', false)
    .eq('can_be_sold_or_donated', false)
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        if (row['owner_phone_number']) {
          row['owner_phone_number'] = row['owner_phone_number'].slice(-4);
        }
        return toDTO(row);
      })
    : [];
}

export async function getLatestDiscsMarkedToBeSoldOrDonated(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data, error } = await supabase
    .from('discs')
    .select(
      'internal_disc_id, disc_name, disc_colour, notified_at, owner_phone_number, can_be_sold_or_donated, is_returned_to_owner, returned_to_owner_text, added_at, can_be_sold_or_donated_date',
    )
    .not('can_be_sold_or_donated_date', 'is', null)
    .order('can_be_sold_or_donated_date', { ascending: true })
    .eq('club_id', clubId);

  console.log(`DATA: ${JSON.stringify(data, null, 2)}`);
  console.log(`error: ${JSON.stringify(error, null, 2)}`);

  const foo = data
    ? data.map((row: any) => {
        if (row['owner_phone_number']) {
          row['owner_phone_number'] = row['owner_phone_number'].slice(-4);
        }
        return toDTO(row);
      })
    : [];
  console.log(`FOO: ${JSON.stringify(foo, null, 2)}`);

  return foo;
}

export async function getDiscsForStats(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data, error } = await supabase
    .from('discs')
    .select(
      'internal_disc_id, disc_name, can_be_sold_or_donated, is_returned_to_owner, returned_to_owner_text, added_at',
    )
    .order('added_at', { ascending: true })
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        if (row['owner_phone_number']) {
          row['owner_phone_number'] = row['owner_phone_number'].slice(-4);
        }
        return toDTO(row);
      })
    : [];
}

export async function getDiscWithFullPhoneNumber(internalDiscId: number): Promise<DiscDTO> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data, error } = await supabase
    .from('discs')
    .select('internal_disc_id, owner_phone_number, owner_name, disc_name, disc_colour, notified_at')
    .eq('club_id', clubId)
    .eq('internal_disc_id', internalDiscId)
    .single();

  return toDTO(data);
}
