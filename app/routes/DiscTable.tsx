import { useMemo, useState } from 'react';

import 'react-data-grid/lib/styles.css';

import { Link, useOutletContext } from '@remix-run/react';

import { add, isAfter } from 'date-fns';

import styled from '@emotion/styled';
import WarningIcon from '@mui/icons-material/Warning';
import TextsmsIcon from '@mui/icons-material/Textsms';

import DataGrid, { SortColumn } from 'react-data-grid';

import { DiscDTO } from '~/types';

type DiscTableProps = {
  clubId: number;
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
  internalDiscId: number;
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
    case 'ownerPhoneNumber':
    case 'course': {
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

  & .rdg-cell-resizable {
    //background: #18521D;
  }
  & .rdg-row-even {
    background: rgb(63, 60, 60);
    //background: #207026;
  }

  & .rdg-row-odd {
    //background: rgb(63, 60, 60);
    //background: #27842e;
  }
`;

const isInDangerOfBeingDonatedOrSold = (dateStr: string): boolean => {
  const date = add(new Date(dateStr), { months: 3 });
  const now = new Date();

  return !isAfter(date, now);
};

const getColumns = (isLoggedIn: boolean, isCourseColumnVisible: boolean): any => {
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
              <StyledWarningIcon
                titleAccess={'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa'}
              />
            )}
          </div>
        );
      },
    },
  ];

  if (isCourseColumnVisible) {
    return [
      ...columns,
      {
        key: 'course',
        name: 'Rata',
        renderCell(props: any) {
          const course = props.row.course?.toLowerCase();

          const getCourseName = () => {
            if (course.indexOf('äijänpelto') === 0) {
              return 'Äijänpelto';
            }

            if (course.indexOf('oittaa') === 0) {
              return 'Oittaa';
            }

            if (course.indexOf('backby') === 0) {
              return 'Backby';
            }

            if (course.indexOf('kiekko backb') !== -1) {
              return '';
            }

            return course;
          };

          return <span>{getCourseName()}</span>;
        },
      },
    ];
  }

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
      course: disc.course,
    };
  });
}

export default function DiscTable({ discs, clubId }: DiscTableProps): JSX.Element | null {
  const { session } = useOutletContext();

  const isLoggedIn = (): boolean => {
    return !!session?.user?.id;
  };

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
      columns={getColumns(isLoggedIn(), clubId === 1)}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
    />
  );
}
