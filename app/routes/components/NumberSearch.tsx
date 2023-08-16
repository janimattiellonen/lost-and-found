import TextField from '@mui/material/TextField';

type NumberSearchProps = {
    onChange: (e: any) => void;
};
export default function NumberSearch({ onChange }: NumberSearchProps): JSX.Element {
    return (
        <div>
            <TextField label="Puh nro., 4 viimeistä" variant="outlined" onChange={(e) => onChange(e)} />
        </div>
    );
}
