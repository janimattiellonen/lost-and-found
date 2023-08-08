import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

type DiscSelectorProps = {
  discNames: string[];
  onChange: (e: string | null) => void;
};
export default function DiscSelector({
  discNames,
  onChange,
}: DiscSelectorProps): JSX.Element {

  const options = discNames.map( (discName) => {
    return discName
  })

  return (
    <Autocomplete
      disablePortal
      id="combo-box-demo"
      options={options}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Valitse kiekko" />}
      onChange={(event: any, newValue: string | null) => {
        onChange(newValue);
      }}
    />
  );
}
