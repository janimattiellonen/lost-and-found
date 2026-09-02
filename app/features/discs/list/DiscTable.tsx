import { Fragment, useMemo, useState, type JSX } from 'react';

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

import { setDiscCourse } from '~/features/discs/courseChange/setDiscCourse';
import { deleteDisc } from '~/features/discs/deletion/deleteDisc';
import { disposalMethodOptions } from '~/features/discs/disposal/disposalMethod';
import { markForDisposal } from '~/features/discs/disposal/markForDisposal';
import { markAsReturned } from '~/features/discs/return/markAsReturned';
import { returnMethodOptions } from '~/features/discs/return/returnMethod';
import CourseForm from '~/features/discs/list/CourseForm';
import DateAndMethodForm from '~/features/discs/list/DateAndMethodForm';
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CheckCircleIcon,
  DeleteIcon,
  InfoIcon,
  PlaceIcon,
  SellIcon,
  TextsmsIcon,
  WarningIcon,
} from '~/ui/icons';
import { space } from '~/styles/tokens.stylex';

import type { DiscDTO } from '~/types';
import { formatPhoneNumber } from '~/utils';

type DiscTableProps = {
  discs: DiscDTO[];
  /** Called after a disc has been deleted or marked returned, to reload the list. */
  onChanged?: () => void;
  /**
   * The courses this club collects from; empty for a club that records none.
   * Drives both the Rata column and the admin tool that sets it, so the two
   * cannot disagree about whether this club files discs under a course.
   */
  courses?: string[];
};

interface Row {
  id: number;
  discName: string;
  discColour: string;
  owner: string;
  ownerPhoneNumber: string;
  course: string;
  addedAt: string;
  internalDiscId: number | null;
  /** Only present for a signed-in visitor; the admin actions are keyed on it. */
  externalId?: string;
  /** Club-internal notes. The loader only sends these to a signed-in visitor. */
  additionalInfo?: string;
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
    case 'ownerPhoneNumber':
    case 'course': {
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
    course: disc.course ?? '',
    addedAt: disc.addedAt ?? '',
    internalDiscId: disc.internalDiscId,
    externalId: disc.externalId,
    additionalInfo: disc.additionalInfo,
  }));
}

/** Which of the two marks is open on a row. */
type MarkKind = 'return' | 'disposal';

/** What the row expanded under a disc is showing: a mark form, or its notes. */
type PanelKind = MarkKind | 'info' | 'course';

type OpenPanel = { externalId: string; kind: PanelKind };

/**
 * The club-internal notes on a disc, shown under it rather than in a column of
 * their own: they are free text, and most discs have none.
 */
function AdditionalInfoPanel({ row }: { row: Row }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-gray-400">Lisätiedot – {row.discName}</span>
      <span className="whitespace-pre-wrap">{row.additionalInfo}</span>
    </div>
  );
}

type MarkFormProps = {
  row: Row;
  externalId: string;
  kind: MarkKind;
  onDone: () => void;
  onCancel: () => void;
};

/**
 * The inline form behind both admin marks: returned to its owner, or released
 * for sale or donation.
 *
 * Both record a date and an optional method, replacing the free-text notes that
 * used to be typed into the Google Sheet ("29.8.2026 (Janimatti), postitettu").
 * The wording and the endpoint are all that differ.
 */
function MarkForm({ row, externalId, kind, onDone, onCancel }: MarkFormProps): JSX.Element {
  if (kind === 'disposal') {
    return (
      <DateAndMethodForm
        title="Merkitse myytäväksi tai lahjoitettavaksi"
        discName={row.discName}
        idPrefix={`disposal-${externalId}`}
        dateLabel="Päivämäärä"
        methodLabel="Tapa"
        options={disposalMethodOptions}
        submitLabel="Merkitse"
        onCancel={onCancel}
        onSubmit={async (date, method) => {
          const result = await markForDisposal({
            externalId,
            canBeSoldOrDonatedDate: date,
            canBeSoldOrDonatedMethod: method,
          });

          if (result.status === 'error') {
            return result.message;
          }

          onDone();

          return null;
        }}
      />
    );
  }

  return (
    <DateAndMethodForm
      title="Merkitse palautetuksi"
      discName={row.discName}
      idPrefix={`return-${externalId}`}
      dateLabel="Palautuspäivä"
      methodLabel="Palautustapa"
      options={returnMethodOptions}
      submitLabel="Merkitse palautetuksi"
      onCancel={onCancel}
      onSubmit={async (date, method) => {
        const result = await markAsReturned({
          externalId,
          returnedToOwnerDate: date,
          returnMethod: method,
        });

        if (result.status === 'error') {
          return result.message;
        }

        onDone();

        return null;
      }}
    />
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
      title="Poista kiekko"
      disabled={isDeleting}
      onClick={handleClick}
      className="inline-flex text-red-400 hover:text-red-300 disabled:opacity-40"
    >
      <DeleteIcon width={18} height={18} />
    </button>
  );
}

export default function DiscTable({ discs, onChanged, courses = [] }: DiscTableProps): JSX.Element | null {
  const showCourse = courses.length > 0;

  const { session } = useOutletContext<OutletContext>();
  const isLoggedIn = !!session?.user?.id;

  // Which disc has a panel open under it, and what that panel is showing.
  const [openForm, setOpenForm] = useState<OpenPanel | null>(null);

  /** Opens the given panel on the given disc, or closes it if already open. */
  const toggleForm = (externalId: string, kind: PanelKind): void =>
    setOpenForm((current) =>
      current?.externalId === externalId && current.kind === kind ? null : { externalId, kind },
    );

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
              {/* A signed-in admin is sent the whole number and sees it,
                  grouped for reading; the loader only ever sends the last four
                  to anyone else, so the mask stands in for the digits that
                  never arrived — and four digits need no grouping. */}
              {isLoggedIn ? formatPhoneNumber(row.original.ownerPhoneNumber) : `****${row.original.ownerPhoneNumber}`}
              {/* /message/send is keyed on the external id, which every disc
                  has — a web-added disc can be messaged too. Only a signed-in
                  visitor is sent the id at all. */}
              {isLoggedIn && row.original.externalId && (
                <Link to={`/message/send/${row.original.externalId}`} className="inline-flex">
                  <TextsmsIcon width={18} height={18} />
                </Link>
              )}
            </span>
          ) : (
            ''
          ),
      },
      ...(showCourse ? [{ accessorKey: 'course', header: 'Rata', sortingFn: sortDiscs } satisfies ColumnDef<Row>] : []),
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
                    <>
                      <button
                        type="button"
                        aria-label={`Merkitse kiekko ${row.original.discName} palautetuksi`}
                        title="Merkitse palautetuksi"
                        aria-expanded={openForm?.externalId === row.original.externalId && openForm.kind === 'return'}
                        onClick={() => toggleForm(row.original.externalId!, 'return')}
                        className="inline-flex text-green-400 hover:text-green-300"
                      >
                        <CheckCircleIcon width={18} height={18} />
                      </button>

                      <button
                        type="button"
                        aria-label={`Merkitse kiekko ${row.original.discName} myytäväksi tai lahjoitettavaksi`}
                        title="Merkitse myytäväksi tai lahjoitettavaksi"
                        aria-expanded={openForm?.externalId === row.original.externalId && openForm.kind === 'disposal'}
                        onClick={() => toggleForm(row.original.externalId!, 'disposal')}
                        className="inline-flex text-sky-400 hover:text-sky-300"
                      >
                        <SellIcon width={18} height={18} />
                      </button>

                      {/* Only for a club that files discs under a course.
                          The fix for a disc saved before the course was
                          picked, which used to mean editing the row by hand
                          in the SQL editor. */}
                      {showCourse && (
                        <button
                          type="button"
                          aria-label={`Aseta kiekon ${row.original.discName} rata`}
                          title="Aseta rata"
                          aria-expanded={openForm?.externalId === row.original.externalId && openForm.kind === 'course'}
                          onClick={() => toggleForm(row.original.externalId!, 'course')}
                          className="inline-flex text-violet-400 hover:text-violet-300"
                        >
                          <PlaceIcon width={18} height={18} />
                        </button>
                      )}

                      {/* Most discs carry no notes, so this one is often
                          disabled — which is why the icons around it are
                          coloured rather than grey. */}
                      <button
                        type="button"
                        aria-label={`Näytä kiekon ${row.original.discName} lisätiedot`}
                        title={row.original.additionalInfo ? 'Näytä lisätiedot' : 'Kiekolla ei ole lisätietoja'}
                        disabled={!row.original.additionalInfo}
                        aria-expanded={openForm?.externalId === row.original.externalId && openForm.kind === 'info'}
                        onClick={() => toggleForm(row.original.externalId!, 'info')}
                        className="inline-flex text-amber-400 hover:text-amber-300 disabled:text-gray-500 disabled:hover:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <InfoIcon width={18} height={18} />
                      </button>
                    </>
                  )}

                  <DeleteButton row={row.original} onDeleted={onChanged} />
                </span>
              ),
            } satisfies ColumnDef<Row>,
          ]
        : []),
    ],
    [isLoggedIn, onChanged, openForm, showCourse],
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: 'addedAt', desc: true }]);

  // TanStack Table returns functions the React Compiler cannot memoize, so it
  // skips this component. Nothing here is passed to a memoized consumer, and
  // the alternative is a table library change.
  // eslint-disable-next-line react-hooks/incompatible-library
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
          const open = externalId != null && openForm?.externalId === externalId ? openForm : null;

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

              {/* A mark form, or a disc's notes, opens as a row of its own
                  under the disc it belongs to, rather than as a modal. */}
              {open && (
                <tr {...stylex.props(index % 2 === 1 && styles.rowEven)}>
                  <td colSpan={row.getVisibleCells().length} {...stylex.props(styles.td)}>
                    {open.kind === 'info' ? (
                      <AdditionalInfoPanel row={row.original} />
                    ) : open.kind === 'course' ? (
                      <CourseForm
                        discName={row.original.discName}
                        current={row.original.course || null}
                        courses={courses}
                        idPrefix={`course-${open.externalId}`}
                        onCancel={() => setOpenForm(null)}
                        onSubmit={async (course) => {
                          const result = await setDiscCourse({ externalId: open.externalId, course });

                          if (result.status === 'error') {
                            return result.message;
                          }

                          setOpenForm(null);
                          onChanged?.();

                          return null;
                        }}
                      />
                    ) : (
                      <MarkForm
                        row={row.original}
                        externalId={open.externalId}
                        kind={open.kind}
                        onCancel={() => setOpenForm(null)}
                        onDone={() => {
                          setOpenForm(null);
                          onChanged?.();
                        }}
                      />
                    )}
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
