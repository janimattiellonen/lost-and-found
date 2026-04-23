import Button from '@mui/material/Button';

import type { ClubDTO } from '~/types';

type SyncItemProps = {
  club: ClubDTO;
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return '';
  }

  const formattedDate = new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(dateStr),
  );

  return formattedDate;
}

export default function SyncItem({ club }: SyncItemProps): JSX.Element {
  return (
    <div className="mb-4 flex justify-start gap-4 items-center">
      {club.id}: {club.name} {club.syncLog?.updatedAt && <span>({formatDate(club.syncLog?.updatedAt)})</span>}
      <input type="hidden" name="clubId" value={club.id} />{' '}
      <Button variant="contained" name="all" type="submit" value={'all'}>
        Päivitä KAIKKI {club.name} data
      </Button>
      <Button variant="contained" name="new" type="submit" value={`new`}>
        Päivitä UUSI {club.name} data
      </Button>
    </div>
  );
}
