import Paper from '@mui/material/Paper';

type PaperItemProps = {
  children: string | JSX.Element | JSX.Element[];
};
export default function PaperItem({ children }: PaperItemProps): JSX.Element {
  return <Paper className={'mt-8 p-4'} elevation={1} children={children} />;
}
