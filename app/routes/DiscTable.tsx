import "react-data-grid/lib/styles.css";

import styled from "@emotion/styled";

import DataGrid from "react-data-grid";

import { DiscDTO } from "~/types";

type DiscTableProps = {
  discs: DiscDTO[];
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return "";
  }

  const formattedDate = new Intl.DateTimeFormat("fi-FI").format(
    new Date(dateStr)
  );

  return formattedDate;
}

const Th = styled.th`
  text-align: left;
`;

const StyledDataGrid = styled(DataGrid)`
  block-size: auto;
`;

const columns = [
  { key: "id", name: "#" },
  { key: "discName", name: "Disc name" },
  { key: "discColour", name: "Disc colour" },
  { key: "owner", name: "Owner" },
  {
    key: "ownerPhoneNumber",
    name: "Owner phone number",
    renderCell(props: any) {
      return props.row.ownerPhoneNumber
        ? `****${props.row.ownerPhoneNumber}`
        : "";
    },
  },
  {
    key: "addedAt",
    name: "Added at",
    renderCell(props: any) {
      return formatDate(props.row.addedAt);
    },
  },
];

function mapToDataRows(discs: DiscDTO[]): any {
  return discs.map((disc: DiscDTO, index: number) => {
    return {
      id: index + 1,
      key: index + 1,
      discName: disc.discName,
      discColour: disc.discColour,
      owner: disc.ownerName,
      ownerPhoneNumber: disc.ownerPhoneNumber,
      addedAt: disc.addedAt,
    };
  });
}

export default function DiscTable({
  discs,
}: DiscTableProps): JSX.Element | null {
  if (!discs?.length) {
    return null;
  }

  const rows = mapToDataRows(discs);
  return <StyledDataGrid className="fill-grid" rows={rows} columns={columns} />;
}
