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
