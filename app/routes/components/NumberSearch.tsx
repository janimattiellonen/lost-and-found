import type { ChangeEvent } from 'react';

import TextField from '~/routes/components/TextField';

type NumberSearchProps = {
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export default function NumberSearch({ onChange }: NumberSearchProps): JSX.Element {
  return (
    <div>
      {/* The MUI floating label served as both label and placeholder; here the
          placeholder is the visible hint and aria-label gives it an accessible
          name. */}
      <TextField
        placeholder="Puh nro., 4 viimeistä"
        inputProps={{ 'aria-label': 'Puh nro., 4 viimeistä' }}
        onChange={onChange}
      />
    </div>
  );
}
