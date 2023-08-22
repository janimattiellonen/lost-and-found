import { useMemo, useState } from 'react';

import 'react-data-grid/lib/styles.css';

import { add, isAfter } from 'date-fns';

import styled from '@emotion/styled';
import WarningIcon from '@mui/icons-material/Warning';

import DataGrid, { SortColumn } from 'react-data-grid';

import { DiscDTO } from '~/types';

type DiscTableProps = {
  discs: DiscDTO[];
};

const StyledWarningIcon = styled(WarningIcon)`
  color: red;
`;

interface Row {
  id: string;
  discName: string;
  discColour: string;
  owner: string;
  ownerPhoneNumber: string;
  addedAt: number;
}

type Comparator = (a: Row, b: Row) => number;

function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'id': {
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    }
    case 'discName':
    case 'discColour':
    case 'owner':
    case 'ownerPhoneNumber': {
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    }
    case 'addedAt': {
      return (a, b) => {
        return new Date(a[sortColumn]).getTime() - new Date(b[sortColumn]).getTime();
      };
    }
    default: {
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return '';
  }

  const formattedDate = new Intl.DateTimeFormat('fi-FI').format(new Date(dateStr));

  return formattedDate;
}
const StyledDataGrid = styled(DataGrid)`
  block-size: auto;
  margin-top: 1rem;

  & .rdg-row-even {
    background: rgb(63, 60, 60);
  }
`;

const isInDangerOfBeingDonatedOrSold = (dateStr: string): boolean => {
  const date = add(new Date(dateStr), { months: 6 });
  const now = new Date();

  return !isAfter(date, now);
};

const columns = [
  { key: 'id', name: '#', width: 'max-content' },
  { key: 'discName', name: 'Kiekko' },
  { key: 'discColour', name: 'Väri' },
  { key: 'owner', name: 'Omistaja' },
  {
    key: 'ownerPhoneNumber',
    name: 'Puhelinnumero',
    renderCell(props: any) {
      return props.row.ownerPhoneNumber ? `****${props.row.ownerPhoneNumber}` : '';
    },
  },
  {
    key: 'addedAt',
    name: 'Lisätty',
    renderCell(props: any) {
      return (
        <div className="flex gap-4 items-center">
          {formatDate(props.row.addedAt)}
          {isInDangerOfBeingDonatedOrSold(props.row.addedAt) && (
            <StyledWarningIcon
              titleAccess={'Kiekko on ollut seuran hallussa yli 6kk ja se saatetaan pian myydä tai lahjoittaa'}
            />
          )}
        </div>
      );
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

export default function DiscTable({ discs }: DiscTableProps): JSX.Element | null {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

  const rows = mapToDataRows(discs);

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;

    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);

  return (
    <StyledDataGrid
      defaultColumnOptions={{
        sortable: true,
        resizable: true,
      }}
      rows={sortedRows}
      columns={columns}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
    />
  );
}
