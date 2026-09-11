import { useState } from 'react';

import { format } from 'date-fns';

import type { EmptyingLogDTO } from '~/types';
import Button from '~/ui/Button';
import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import TextField from '~/ui/TextField';

import type { JSX } from 'react';

type EmptyingLogItemProps = {
  item: EmptyingLogDTO;
};

/**
 * One course's row: the mark button plus an opt-in date. The state is local to
 * the row, so ticking "pvm" on one course leaves the others on the current time.
 */
export default function EmptyingLogItem({ item }: EmptyingLogItemProps): JSX.Element {
  const [usesCustomDate, setUsesCustomDate] = useState(false);

  return (
    <div className={'flex gap-4 justify-between items-center [max-width:400px] mb-4'}>
      <span>
        <input type="hidden" name="item" value={item.id} />
        {item.courseName}
      </span>

      {/* The date sits under the button rather than beside it: the row would
          otherwise grow wider than its unexpanded neighbours when ticked. */}
      <div className={'flex flex-col items-end gap-2'}>
        <div className={'flex gap-3 items-center'}>
          <Button variant="contained" type="submit">
            Merkitse tyhjennetyksi
          </Button>
          <FormControlLabel
            control={
              <Checkbox checked={usesCustomDate} onChange={(event) => setUsesCustomDate(event.currentTarget.checked)} />
            }
            label={<span className="text-xs text-gray-500">pvm</span>}
          />
        </div>

        {/* Only rendered when ticked, so an unticked row posts no date at all.
            The "pvm" tick is a separate control, not this field's label, so the
            field carries its own accessible name. */}
        {usesCustomDate && (
          <TextField
            name="emptiedAt"
            type="date"
            required
            defaultValue={format(new Date(), 'y-MM-dd')}
            inputProps={{ 'aria-label': 'Tyhjennyspäivä' }}
          />
        )}
      </div>
    </div>
  );
}
