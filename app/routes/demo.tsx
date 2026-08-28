import { useRef, useState, type FormEvent, type JSX, type KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';

import { parseDiscText, type ParsedDisc } from '~/features/discParser/parseDiscText';
import { color, font, radius, space } from '~/styles/tokens.stylex';

/** The six fields shown in the table, all of them editable by hand. */
type EditableField = 'discName' | 'plastic' | 'colour' | 'manufacturer' | 'phoneNumber' | 'ownerName';

type Row = ParsedDisc & { id: number; input: string };

/** Which cell, if any, is currently open for editing. */
type EditTarget = { rowId: number; field: EditableField };

const styles = stylex.create({
  page: { padding: space.lg, fontFamily: font.family, color: color.textPrimary },
  // The global CSS reset strips heading styles, so set them here.
  heading: { fontSize: font.sizeXl, fontWeight: font.weightBold, marginBottom: space.sm },
  intro: { marginBottom: space.lg, color: color.textSecondary },
  label: { display: 'block', fontWeight: font.weightBold, marginBottom: space.xs, color: color.textSecondary },
  form: { marginBottom: space.lg },
  input: {
    width: '100%',
    maxWidth: '640px',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: font.sizeMd,
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus': color.accent },
    borderRadius: radius.sm,
    outline: 'none',
  },
  hint: { marginTop: space.xs, fontSize: font.sizeSm, color: color.textMuted },
  // The table can outgrow a narrow window; let it scroll on its own.
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: font.sizeSm },
  th: {
    padding: space.sm,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontWeight: font.weightBold,
    color: color.textSecondary,
    backgroundColor: color.surfaceMuted,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
  },
  td: {
    padding: space.sm,
    verticalAlign: 'top',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
  },
  empty: { color: color.textMuted },
  none: { color: color.textMuted, fontStyle: 'italic' },
  // The static value is a button so a cell can be reached and opened by
  // keyboard as well as by clicking it.
  cellButton: {
    display: 'block',
    width: '100%',
    padding: '2px 4px',
    margin: '-2px -4px',
    textAlign: 'left',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    background: { default: 'none', ':hover': color.surfaceMuted },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: 'transparent', ':focus-visible': color.accent },
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  cellInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '2px 4px',
    margin: '-2px -4px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.accent,
    borderRadius: radius.sm,
    outline: 'none',
  },
});

const columns: { header: string; field: EditableField }[] = [
  { header: 'Kiekko', field: 'discName' },
  { header: 'Muovi', field: 'plastic' },
  { header: 'Väri', field: 'colour' },
  { header: 'Valmistaja', field: 'manufacturer' },
  { header: 'Puhelinnumero', field: 'phoneNumber' },
  { header: 'Omistaja', field: 'ownerName' },
];

type CellProps = {
  value: string | null;
  header: string;
  isEditing: boolean;
  onOpen: () => void;
  onCommit: (value: string) => void;
  onCancel: () => void;
};

function Cell({ value, header, isEditing, onOpen, onCommit, onCancel }: CellProps): JSX.Element {
  if (isEditing) {
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
      if (event.key === 'Enter') {
        event.preventDefault();
        onCommit(event.currentTarget.value);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }

    return (
      <input
        type="text"
        aria-label={header}
        defaultValue={value ?? ''}
        // Focus and select on mount, so the old value can be typed straight
        // over. A ref callback rather than an effect: the repo lints against
        // setting state synchronously inside one.
        ref={(element) => {
          element?.focus();
          element?.select();
        }}
        onKeyDown={handleKeyDown}
        // Clicking away keeps the edit rather than discarding it; Escape is
        // the way to back out.
        onBlur={(event) => onCommit(event.currentTarget.value)}
        {...stylex.props(styles.cellInput)}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`${header}: ${value ?? 'tyhjä'}`}
      onClick={onOpen}
      {...stylex.props(styles.cellButton)}
    >
      {value ?? <span {...stylex.props(styles.empty)}>–</span>}
    </button>
  );
}

export default function DemoPage(): JSX.Element {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const nextId = useRef(1);

  /** Writes an edited cell back to the in-memory table and closes the editor. */
  function commit(target: EditTarget, value: string): void {
    const trimmed = value.trim();

    setRows((current) =>
      current.map((row) => (row.id === target.rowId ? { ...row, [target.field]: trimmed || null } : row)),
    );

    setEditing(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const form = event.currentTarget;
    const input = new FormData(form).get('discText');
    const text = typeof input === 'string' ? input.trim() : '';

    if (text.length === 0) {
      return;
    }

    setRows((current) => [...current, { id: nextId.current++, input: text, ...parseDiscText(text) }]);

    // Clear so the next disc can be typed straight away.
    form.reset();
  }

  return (
    <div {...stylex.props(styles.page)}>
      <h2 {...stylex.props(styles.heading)}>Kiekkotekstin tunnistus</h2>

      <p {...stylex.props(styles.intro)}>
        Kokeiluversio. Mitään ei tallenneta – tyhjennä taulukko lataamalla sivu uudelleen. Korjaa tietoja napsauttamalla
        solua; Enter tallentaa, Esc peruu.
      </p>

      <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
        <label htmlFor="discText" {...stylex.props(styles.label)}>
          Kiekon tiedot
        </label>
        <input
          id="discText"
          name="discText"
          type="text"
          autoComplete="off"
          placeholder="Esim. Star Destroyer punainen 050 123 4567 Steve D."
          {...stylex.props(styles.input)}
        />
        <p {...stylex.props(styles.hint)}>Paina Enter tunnistaaksesi tiedot.</p>
      </form>

      <div {...stylex.props(styles.tableWrap)}>
        <table {...stylex.props(styles.table)}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.field} scope="col" {...stylex.props(styles.th)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} {...stylex.props(styles.td, styles.none)}>
                  Ei vielä tunnistettuja kiekkoja.
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => {
                  const target = { rowId: row.id, field: column.field };

                  return (
                    <td key={column.field} {...stylex.props(styles.td)}>
                      <Cell
                        value={row[column.field]}
                        header={column.header}
                        isEditing={editing?.rowId === row.id && editing.field === column.field}
                        onOpen={() => setEditing(target)}
                        onCommit={(value) => commit(target, value)}
                        onCancel={() => setEditing(null)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
