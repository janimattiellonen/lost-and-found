import { Fragment, useMemo, useState, type FormEvent, type JSX } from 'react';

import { Link, useOutletContext } from 'react-router';

import { add, format, isAfter } from 'date-fns';

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

import { deleteDisc } from '~/features/discDeletion/deleteDisc';
import { markAsReturned } from '~/features/discReturn/markAsReturned';
import { returnMethodOptions, type ReturnMethodValue } from '~/features/discReturn/returnMethod';
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CheckCircleIcon,
  DeleteIcon,
  TextsmsIcon,
  WarningIcon,
} from '~/routes/components/icons';
import { space } from '~/styles/tokens.stylex';

import type { DiscDTO } from '~/types';

type DiscTableProps = {
  discs: DiscDTO[];
  /** Called after a disc has been deleted or marked returned, to reload the list. */
  onChanged?: () => void;
};

interface Row {
  id: number;
  discName: string;
  discColour: string;
  owner: string;
  ownerPhoneNumber: string;
  addedAt: string;
  internalDiscId: number | null;
  /** Only present for a signed-in visitor; the admin actions are keyed on it. */
  externalId?: string;
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
    externalId: disc.externalId,
  }));
}

type ReturnFormProps = {
  row: Row;
  externalId: string;
  onDone: () => void;
  onCancel: () => void;
};

/**
 * Records a disc as returned to its owner: the date, and how it got there.
 *
 * Replaces the free-text note that used to be typed into the Google Sheet. The
 * method is optional — the radios can be cleared — because the older entries
 * did not always say.
 */
function ReturnForm({ row, externalId, onDone, onCancel }: ReturnFormProps): JSX.Element {
  const [returnedOn, setReturnedOn] = useState(() => format(new Date(), 'y-MM-dd'));
  const [method, setMethod] = useState<ReturnMethodValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setIsSaving(true);
    setError(null);

    const result = await markAsReturned({ externalId, returnedToOwnerDate: returnedOn, returnMethod: method });

    setIsSaving(false);

    if (result.status === 'error') {
      setError(result.message);
      return;
    }

    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6 py-2">
      <p className="basis-full text-xs text-gray-600">
        Merkitse palautetuksi: <b>{row.discName}</b>
      </p>

      <div>
        <label htmlFor={`returned-on-${externalId}`} className="block text-xs font-bold text-gray-600 mb-1">
          Palautuspäivä
        </label>
        <input
          id={`returned-on-${externalId}`}
          type="date"
          required
          value={returnedOn}
          onChange={(event) => setReturnedOn(event.currentTarget.value)}
          className="border border-gray-300 rounded px-2 py-1"
        />
      </div>

      <fieldset>
        <legend className="text-xs font-bold text-gray-600 mb-1">Palautustapa</legend>
        <div className="flex items-center gap-4">
          {returnMethodOptions.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-1">
              <input
                type="radio"
                name={`return-method-${externalId}`}
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
              />
              {option.label}
            </label>
          ))}

          <button
            type="button"
            // The method is nullable, so there has to be a way back to "not
            // answered" once a radio has been picked.
            disabled={method === null}
            onClick={() => setMethod(null)}
            className="text-xs underline text-gray-500 disabled:opacity-40 disabled:no-underline"
          >
            Tyhjennä
          </button>
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white rounded px-3 py-1"
        >
          {isSaving ? 'Tallennetaan...' : 'Merkitse palautetuksi'}
        </button>

        <button type="button" onClick={onCancel} className="border border-gray-300 hover:bg-gray-100 rounded px-3 py-1">
          Peruuta
        </button>
      </div>

      {error && <p className="basis-full text-red-700">{error}</p>}
    </form>
  );
}

type DeleteButtonProps = {
  row: Row;
  onDeleted?: () => void;
};

/**
 * Deletes one disc, after a confirmation. Owns its own busy state so the rest
 * of the table does not re-render while one row is being deleted.
 */
function DeleteButton({ row, onDeleted }: DeleteButtonProps): JSX.Element | null {
  const [isDeleting, setIsDeleting] = useState(false);

  const externalId = row.externalId;

  // No external id means the loader did not send one, i.e. nobody is signed in.
  if (!externalId) {
    return null;
  }

  const handleClick = async (): Promise<void> => {
    const owner = row.owner ? ` (${row.owner})` : '';

    if (!window.confirm(`Poistetaanko kiekko ${row.discName}${owner}? Poistoa ei voi peruuttaa.`)) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteDisc(externalId);

    setIsDeleting(false);

    if (result.status === 'error') {
      window.alert(result.message);
      return;
    }

    onDeleted?.();
  };

  return (
    <button
      type="button"
      aria-label={`Poista kiekko ${row.discName}`}
      disabled={isDeleting}
      onClick={handleClick}
      className="inline-flex text-gray-500 hover:text-red-600 disabled:opacity-40"
    >
      <DeleteIcon width={18} height={18} />
    </button>
  );
}

export default function DiscTable({ discs, onChanged }: DiscTableProps): JSX.Element | null {
  const { session } = useOutletContext<OutletContext>();
  const isLoggedIn = !!session?.user?.id;

  // The disc whose return form is open, by external id.
  const [returningId, setReturningId] = useState<string | null>(null);

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
              {/* Only sheet-imported discs can be messaged: /message/send is
                  keyed on internalDiscId, which web-added discs do not have. */}
              {isLoggedIn && row.original.internalDiscId !== null && (
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
      // A column of its own rather than icons in the phone number cell: a disc
      // with no phone number has an empty cell there, and it still has to be
      // deletable and markable as returned.
      ...(isLoggedIn
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              enableResizing: false,
              cell: ({ row }) => (
                <span className="inline-flex items-center gap-2">
                  {row.original.externalId && (
                    <button
                      type="button"
                      aria-label={`Merkitse kiekko ${row.original.discName} palautetuksi`}
                      aria-expanded={returningId === row.original.externalId}
                      onClick={() =>
                        setReturningId((current) =>
                          current === row.original.externalId ? null : (row.original.externalId ?? null),
                        )
                      }
                      className="inline-flex text-gray-500 hover:text-green-700"
                    >
                      <CheckCircleIcon width={18} height={18} />
                    </button>
                  )}

                  <DeleteButton row={row.original} onDeleted={onChanged} />
                </span>
              ),
            } satisfies ColumnDef<Row>,
          ]
        : []),
    ],
    [isLoggedIn, onChanged, returningId],
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
              const tight = header.column.id === 'id' || header.column.id === 'actions';
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
        {table.getRowModel().rows.map((row, index) => {
          const externalId = row.original.externalId;
          const isReturning = externalId != null && externalId === returningId;

          return (
            <Fragment key={row.id}>
              <tr {...stylex.props(index % 2 === 1 && styles.rowEven)}>
                {row.getVisibleCells().map((cell) => {
                  const tight = cell.column.id === 'id' || cell.column.id === 'actions';
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

              {/* The return form opens as a row of its own, under the disc it
                  belongs to, rather than as a modal. */}
              {isReturning && (
                <tr {...stylex.props(index % 2 === 1 && styles.rowEven)}>
                  <td colSpan={row.getVisibleCells().length} {...stylex.props(styles.td)}>
                    <ReturnForm
                      row={row.original}
                      externalId={externalId}
                      onCancel={() => setReturningId(null)}
                      onDone={() => {
                        setReturningId(null);
                        onChanged?.();
                      }}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
