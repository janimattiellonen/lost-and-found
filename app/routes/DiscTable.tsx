import { useMemo, useState } from 'react';

import 'react-data-grid/lib/styles.css';
import '~/styles/disc-table.css';

import { Link, useOutletContext } from 'react-router';

import { add, isAfter } from 'date-fns';

import * as stylex from '@stylexjs/stylex';

import { ArrowDownwardIcon, ArrowUpwardIcon, TextsmsIcon, WarningIcon } from '~/routes/components/icons';
import { space } from '~/styles/tokens.stylex';

import type { RenderSortStatusProps, SortColumn } from 'react-data-grid';
import DataGrid from 'react-data-grid';

import type { DiscDTO } from '~/types';

type DiscTableProps = {
  discs: DiscDTO[];
};


interface Row {
  id: number;
  discName: string;
  discColour: string;
  owner: string;
  ownerPhoneNumber: string;
  addedAt: number;
  internalDiscId: number;
}

type OutletContext = {
  session: { user?: { id?: string } } | null;
};

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
const styles = stylex.create({
  sortIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    marginInlineStart: space.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

function renderSortStatus({ sortDirection }: RenderSortStatusProps): JSX.Element | null {
  if (!sortDirection) {
    return null;
  }

  return (
    <span {...stylex.props(styles.sortIcon)}>
      {sortDirection === 'ASC' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
    </span>
  );
}

const isInDangerOfBeingDonatedOrSold = (dateStr: string): boolean => {
  const date = add(new Date(dateStr), { months: 3 });
  const now = new Date();

  return !isAfter(date, now);
};

const getColumns = (isLoggedIn: boolean): any => {
  const columns = [
    { key: 'id', name: '#', width: 'max-content' },
    { key: 'discName', name: 'Kiekko' },
    { key: 'discColour', name: 'Väri' },
    { key: 'owner', name: 'Omistaja' },
    {
      key: 'ownerPhoneNumber',
      name: 'Puhelinnumero',
      renderCell(props: any) {
        return props.row.ownerPhoneNumber ? (
          <span>
            ****{props.row.ownerPhoneNumber}{' '}
            {isLoggedIn === true && (
              <Link to={`/message/send/${props.row.internalDiscId}`}>
                <TextsmsIcon />
              </Link>
            )}
          </span>
        ) : (
          ''
        );
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
              <WarningIcon
                title={'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa'}
                style={{ color: 'red' }}
              />
            )}
          </div>
        );
      },
    },
  ];

  return columns;
};

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
      internalDiscId: disc.internalDiscId,
    };
  });
}

export default function DiscTable({ discs }: DiscTableProps): JSX.Element | null {
  const { session } = useOutletContext<OutletContext>();

  const isLoggedIn = (): boolean => {
    return !!session?.user?.id;
  };

  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([{ columnKey: 'addedAt', direction: 'DESC' }]);

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
    <DataGrid
      className="disc-grid"
      defaultColumnOptions={{
        sortable: true,
        resizable: true,
      }}
      rows={sortedRows}
      columns={getColumns(isLoggedIn())}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
      renderers={{ renderSortStatus }}
    />
  );
}
