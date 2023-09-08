import { createConnection } from '~/models/utils';
import { toDTO } from '~/models/ClubMapper';

export async function fetchClubs() {
  const supabase = createConnection();

  let { data, error } = await supabase
    .from('clubs')
    .select('id, created_at, updated_at, name, sync_log(id, club_id, updated_at)');

  if (error) {
    throw new Error('Failed to retrieve clubs');
  }

  const mapped = data && data.map((item) => toDTO(item));

  return mapped;
}
