import H2 from '~/routes/components/H2';
import { DiscDTO } from '~/types';
import { formatDate } from '~/routes/utils';
import DiscTable from '~/routes/DiscTable';
import DonatedDiscsTable from '~/routes/DonatedDiscsTable';

type LatestDonatedDiscsPageType = {
  data: DiscDTO[]
}

export function LatestDonatedDiscsPage({data}:LatestDonatedDiscsPageType) {
  return (
    <div>
      <DonatedDiscsTable discs={data}/>
    </div>
  )
}