import { useMemo, useState } from 'react';

import { Link, useOutletContext } from 'react-router';

import { add, isAfter } from 'date-fns';

import * as stylex from '@stylexjs/stylex';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingFn,
  type SortingState,
} from '@tanstack/react-table';

import { ArrowDownwardIcon, ArrowUpwardIcon, TextsmsIcon, WarningIcon } from '~/routes/components/icons';
import { space } from '~/styles/tokens.stylex';

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
  addedAt: string;
  internalDiscId: number;
}

type OutletContext = {
  session: { user?: { id?: string } } | null;
};

type Comparator = (a: Row, b: Row) => number;

function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'id': {
      return (a, b) => a.id - b.id;
    }
    case 'discName':
    case 'discColour':
    case 'owner':
    case 'ownerPhoneNumber': {
      return (a, b) => a[sortColumn].localeCompare(b[sortColumn]);
    }
    case 'addedAt': {
      return (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    }
    default: {
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
  }
}

// Reuse the existing comparators as a TanStack sortingFn (ascending; TanStack
// negates for descending).
const sortDiscs: SortingFn<Row> = (a, b, columnId) => getComparator(columnId)(a.original, b.original);

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return '';
  }

  return new Intl.DateTimeFormat('fi-FI').format(new Date(dateStr));
}

const isInDangerOfBeingDonatedOrSold = (dateStr: string): boolean => {
  const date = add(new Date(dateStr), { months: 3 });
  const now = new Date();

  return !isAfter(date, now);
};

// Dark table theme matching the previous react-data-grid rendering: a dark base
// with light text, the header slightly darker, and even rows a subtly lighter
// shade (rgb(63,60,60)) — not the harsh white/dark zebra of a light base.
const styles = stylex.create({
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: space.md,
    fontSize: '0.875rem',
    backgroundColor: '#212121',
    color: '#ddd',
  },
  th: {
    position: 'relative',
    boxSizing: 'border-box',
    textAlign: 'left',
    fontWeight: 700,
    padding: '8px 12px',
    color: '#fff',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(255,255,255,0.15)',
    userSelect: 'none',
    backgroundColor: { default: '#292929', ':hover': '#333' },
  },
  thSortable: { cursor: 'pointer' },
  thSorted: { backgroundColor: '#383838' },
  // Shrink a column to its content width (used for the "#" column).
  tight: { width: '1%', whiteSpace: 'nowrap' },
  td: {
    boxSizing: 'border-box',
    padding: '8px 12px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  // Even rows a subtle shade lighter than the base, as in the old grid.
  rowEven: { backgroundColor: 'rgb(63, 60, 60)' },
  sortIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    marginInlineStart: space.xs,
  },
  resizer: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: '5px',
    cursor: 'col-resize',
    userSelect: 'none',
    touchAction: 'none',
  },
});

function mapToDataRows(discs: DiscDTO[]): Row[] {
  return discs.map((disc, index) => ({
    id: index + 1,
    discName: disc.discName,
    discColour: disc.discColour,
    owner: disc.ownerName ?? '',
    ownerPhoneNumber: disc.ownerPhoneNumber ?? '',
    addedAt: disc.addedAt ?? '',
    internalDiscId: disc.internalDiscId,
  }));
}

export default function DiscTable({ discs }: DiscTableProps): JSX.Element | null {
  const { session } = useOutletContext<OutletContext>();
  const isLoggedIn = !!session?.user?.id;

  const rows = useMemo(() => mapToDataRows(discs), [discs]);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: 'id', header: '#', enableResizing: false, sortingFn: sortDiscs },
      { accessorKey: 'discName', header: 'Kiekko', sortingFn: sortDiscs },
      { accessorKey: 'discColour', header: 'Väri', sortingFn: sortDiscs },
      { accessorKey: 'owner', header: 'Omistaja', sortingFn: sortDiscs },
      {
        accessorKey: 'ownerPhoneNumber',
        header: 'Puhelinnumero',
        sortingFn: sortDiscs,
        cell: ({ row }) =>
          row.original.ownerPhoneNumber ? (
            // inline-flex keeps the SMS icon on the same line — Tailwind's
            // preflight sets `svg { display: block }`, which otherwise wraps it.
            <span className="inline-flex items-center gap-2">
              ****{row.original.ownerPhoneNumber}
              {isLoggedIn && (
                <Link to={`/message/send/${row.original.internalDiscId}`} className="inline-flex">
                  <TextsmsIcon width={18} height={18} />
                </Link>
              )}
            </span>
          ) : (
            ''
          ),
      },
      {
        accessorKey: 'addedAt',
        header: 'Lisätty',
        sortingFn: sortDiscs,
        cell: ({ row }) => (
          <div className="flex gap-4 items-center">
            {formatDate(row.original.addedAt)}
            {isInDangerOfBeingDonatedOrSold(row.original.addedAt) && (
              <WarningIcon
                title={'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa'}
                style={{ color: 'red' }}
              />
            )}
          </div>
        ),
      },
    ],
    [isLoggedIn],
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: 'addedAt', desc: true }]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  return (
    <table {...stylex.props(styles.table)}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const sorted = header.column.getIsSorted();
              const tight = header.column.id === 'id';
              return (
                <th
                  key={header.id}
                  {...stylex.props(
                    styles.th,
                    header.column.getCanSort() && styles.thSortable,
                    sorted && styles.thSorted,
                    tight && styles.tight,
                  )}
                  style={tight ? undefined : { width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {sorted && (
                    <span {...stylex.props(styles.sortIcon)}>
                      {sorted === 'asc' ? (
                        <ArrowUpwardIcon width={16} height={16} />
                      ) : (
                        <ArrowDownwardIcon width={16} height={16} />
                      )}
                    </span>
                  )}
                  {header.column.getCanResize() && (
                    // Pointer-only column resize handle, hidden from assistive
                    // tech (resizing isn't keyboard-operated, as with the grid).
                    <div
                      aria-hidden="true"
                      {...stylex.props(styles.resizer)}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row, index) => (
          <tr key={row.id} {...stylex.props(index % 2 === 1 && styles.rowEven)}>
            {row.getVisibleCells().map((cell) => {
              const tight = cell.column.id === 'id';
              return (
                <td
                  key={cell.id}
                  {...stylex.props(styles.td, tight && styles.tight)}
                  style={tight ? undefined : { width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
