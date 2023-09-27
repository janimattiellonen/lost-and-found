import H3 from '../H3';
import MessageTemplateItem from '~/routes/components/admin/MessageTemplateItem';
import Paper from '@mui/material/Paper';

type MessagePreviewProps = {
  message: string;
};
export default function MessagePreview({ message }: MessagePreviewProps): JSX.Element {
  return (
    <Paper
      className={'mt-8'}
      elevation={1}
      children={
        <div className="p-4">
          <H3 className="mb-2">Esikatselu</H3>

          <div dangerouslySetInnerHTML={{ __html: message }} />
        </div>
      }
    />
  );
}
