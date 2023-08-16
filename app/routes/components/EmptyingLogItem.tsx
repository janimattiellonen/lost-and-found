import {EmptyingLogDTO} from "~/types";

type EmptyingLogItemProps = {
  item: EmptyingLogDTO
  showCourseName: boolean
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return "";
  }

  const formattedDate = new Intl.DateTimeFormat("fi-FI", {dateStyle: 'short'}).format(
    new Date(dateStr)
  );

  return formattedDate;
}

export default function EmptyingLogItem({item, showCourseName}: EmptyingLogItemProps): JSX.Element {
  const className = showCourseName ? 'flex gap-4 justify-between [max-width:200px]' : ""
  return <div className={className}>
    <span>{showCourseName && item.courseName}</span>
    <span>{item.emptiedAt ? formatDate(item.emptiedAt) : "Ei tiedossa"}</span>
  </div>
}
