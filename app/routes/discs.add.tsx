import { useRef, useState, type FormEvent, type JSX, type KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { redirect, type LoaderFunctionArgs } from 'react-router';

import { parseDiscText, type ParsedDisc } from '~/features/discParser/parseDiscText';
import { submitDiscs, toSubmission } from '~/features/discSubmission/submitDiscs';
import { isUserLoggedIn } from '~/models/utils';
import { DeleteIcon } from '~/routes/components/icons';
import { color, font, radius, space } from '~/styles/tokens.stylex';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return null;
};

/** The six fields shown in the table, all of them editable by hand. */
type EditableField = 'discName' | 'plastic' | 'colour' | 'manufacturer' | 'phoneNumber' | 'ownerName';

type Row = ParsedDisc & { id: number; input: string };

/** Which cell, if any, is currently open for editing. */
type EditTarget = { rowId: number; field: EditableField };

/** Where the save is up to; drives the button label and the feedback box. */
type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'success'; savedCount: number }
  | { status: 'error'; message: string };

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
  // The words the parser could not place. Muted, because a weight or a note is
  // expected to land here and must not read as an error.
  leftovers: { color: color.textMuted, fontStyle: 'italic' },
  // Only 'low' is worth showing: it means the disc name and the plastic named
  // different makers, so the one picked is roughly a coin flip. 'medium' fires
  // on half of all entries and has never yet been wrong, which would make it
  // noise.
  flaggedCell: { display: 'flex', alignItems: 'baseline', gap: space.xs },
  uncertain: { color: '#8a6100', cursor: 'help' },
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
  actionCell: { whiteSpace: 'nowrap', textAlign: 'right' },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    color: { default: color.textMuted, ':hover': color.danger },
    background: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: 'transparent', ':focus-visible': color.accent },
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  confirm: { display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.sizeSm },
  confirmButton: {
    padding: '2px 8px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: color.onAccent,
    backgroundColor: { default: color.danger, ':hover': '#b71c1c' },
    borderStyle: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '2px 8px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: color.textSecondary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  footer: { display: 'flex', alignItems: 'center', gap: space.md, marginTop: space.lg },
  submit: {
    padding: '10px 20px',
    fontFamily: 'inherit',
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    color: color.onAccent,
    backgroundColor: { default: color.accent, ':hover': color.accentHover },
    borderStyle: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  submitDisabled: {
    backgroundColor: { default: color.border, ':hover': color.border },
    cursor: 'not-allowed',
  },
  feedback: {
    padding: space.md,
    marginTop: space.md,
    borderRadius: radius.sm,
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  success: { color: '#1b5e20', backgroundColor: '#e8f5e9', borderColor: '#a5d6a7' },
  error: { color: '#8e0000', backgroundColor: '#fdecea', borderColor: '#f5c2c0' },
  // Present for screen readers, out of the way visually.
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
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

/** Shown beside a manufacturer the parser had to guess between two makers. */
const UNCERTAIN_HINT = 'Valmistaja on epävarma – tarkista.';

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

export default function AddDiscsPage(): JSX.Element {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  // The row whose delete button has been pressed and is awaiting a yes/no.
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });
  const nextId = useRef(1);

  /**
   * Any change to the table makes an earlier "saved" or "failed" box stale, so
   * it is cleared as soon as the data moves on.
   */
  function updateRows(update: (current: Row[]) => Row[]): void {
    setRows(update);
    setSubmitState({ status: 'idle' });
  }

  /** Writes an edited cell back to the in-memory table and closes the editor. */
  function commit(target: EditTarget, value: string): void {
    const trimmed = value.trim();

    updateRows((current) =>
      current.map((row) => {
        if (row.id !== target.rowId) {
          return row;
        }

        const edited = { ...row, [target.field]: trimmed || null };

        // Typing the maker by hand is stating it outright, which is what 'high'
        // means -- so a corrected cell stops being flagged as a guess.
        return target.field === 'manufacturer'
          ? { ...edited, confidence: { ...row.confidence, manufacturer: 'high' as const } }
          : edited;
      }),
    );

    setEditing(null);
  }

  function remove(rowId: number): void {
    updateRows((current) => current.filter((row) => row.id !== rowId));
    setConfirmingDelete(null);

    // The row is gone; do not leave an editor pointing at it.
    setEditing((current) => (current?.rowId === rowId ? null : current));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const form = event.currentTarget;
    const input = new FormData(form).get('discText');
    const text = typeof input === 'string' ? input.trim() : '';

    if (text.length === 0) {
      return;
    }

    updateRows((current) => [...current, { id: nextId.current++, input: text, ...parseDiscText(text) }]);

    // Clear so the next disc can be typed straight away.
    form.reset();
  }

  const isSending = submitState.status === 'sending';

  async function handleSave(): Promise<void> {
    setSubmitState({ status: 'sending' });

    const result = await submitDiscs(rows.map(toSubmission));

    if (result.status === 'error') {
      setSubmitState({ status: 'error', message: result.message });
      return;
    }

    setSubmitState({ status: 'success', savedCount: result.savedCount });

    // The batch is persisted, so clear the table for the next one. Done with
    // setRows rather than updateRows, which would wipe the success box.
    setRows([]);
    setEditing(null);
    setConfirmingDelete(null);
  }

  return (
    <div {...stylex.props(styles.page)}>
      <h2 {...stylex.props(styles.heading)}>Lisää kiekkoja</h2>

      <p {...stylex.props(styles.intro)}>
        Korjaa tietoja napsauttamalla solua; Enter tallentaa, Esc peruu. Tallennus vie kiekot tietokantaan ja julkiselle
        listalle.
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
              <th scope="col" {...stylex.props(styles.th)}>
                Ohitettu
              </th>
              <th scope="col" {...stylex.props(styles.th)}>
                <span {...stylex.props(styles.srOnly)}>Toiminnot</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} {...stylex.props(styles.td, styles.none)}>
                  Ei vielä tunnistettuja kiekkoja.
                </td>
              </tr>
            )}

            {rows.map((row, index) => (
              <tr key={row.id}>
                {columns.map((column) => {
                  const target = { rowId: row.id, field: column.field };
                  const isGuessed = column.field === 'manufacturer' && row.confidence.manufacturer === 'low';

                  return (
                    <td key={column.field} {...stylex.props(styles.td, isGuessed && styles.flaggedCell)}>
                      <Cell
                        value={row[column.field]}
                        header={column.header}
                        isEditing={editing?.rowId === row.id && editing.field === column.field}
                        onOpen={() => setEditing(target)}
                        onCommit={(value) => commit(target, value)}
                        onCancel={() => setEditing(null)}
                      />

                      {isGuessed && (
                        <span {...stylex.props(styles.uncertain)} title={UNCERTAIN_HINT}>
                          <span aria-hidden="true">?</span>
                          <span {...stylex.props(styles.srOnly)}>{UNCERTAIN_HINT}</span>
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* What the parser could not place, so a typo or a dropped
                    word is visible rather than silently missing. */}
                <td {...stylex.props(styles.td, styles.leftovers)}>
                  {row.unmatched.length > 0 ? row.unmatched.join(' ') : '–'}
                </td>

                <td {...stylex.props(styles.td, styles.actionCell)}>
                  {confirmingDelete === row.id ? (
                    <span {...stylex.props(styles.confirm)}>
                      Poistetaanko?
                      <button type="button" onClick={() => remove(row.id)} {...stylex.props(styles.confirmButton)}>
                        Kyllä
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(null)}
                        {...stylex.props(styles.cancelButton)}
                      >
                        Peruuta
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Poista rivi ${index + 1}`}
                      onClick={() => setConfirmingDelete(row.id)}
                      {...stylex.props(styles.iconButton)}
                    >
                      <DeleteIcon width="16" height="16" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div {...stylex.props(styles.footer)}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSending || rows.length === 0}
          {...stylex.props(styles.submit, (isSending || rows.length === 0) && styles.submitDisabled)}
        >
          {isSending ? 'Lähettää...' : 'Tallenna kiekot'}
        </button>

        {rows.length > 0 && !isSending && (
          <span {...stylex.props(styles.hint)}>
            {rows.length} {rows.length === 1 ? 'kiekko' : 'kiekkoa'} tallennettavana.
          </span>
        )}
      </div>

      {/* Announced politely so the outcome reaches a screen reader too. */}
      <div role="status" aria-live="polite">
        {submitState.status === 'success' && (
          <p {...stylex.props(styles.feedback, styles.success)}>
            Tallennettu. {submitState.savedCount} {submitState.savedCount === 1 ? 'kiekko' : 'kiekkoa'} lisättiin.
          </p>
        )}

        {submitState.status === 'error' && (
          <p {...stylex.props(styles.feedback, styles.error)}>{submitState.message}</p>
        )}
      </div>
    </div>
  );
}
