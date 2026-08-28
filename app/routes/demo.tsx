import { useRef, useState, type FormEvent, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { parseDiscText, type ParsedDisc } from '~/features/discParser/parseDiscText';
import { color, font, radius, space } from '~/styles/tokens.stylex';

type Row = ParsedDisc & { id: number; input: string };

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
});

const columns: { header: string; field: keyof ParsedDisc }[] = [
  { header: 'Kiekko', field: 'discName' },
  { header: 'Muovi', field: 'plastic' },
  { header: 'Väri', field: 'colour' },
  { header: 'Valmistaja', field: 'manufacturer' },
  { header: 'Puhelinnumero', field: 'phoneNumber' },
  { header: 'Omistaja', field: 'ownerName' },
];

function Cell({ value }: { value: string | null }): JSX.Element {
  if (!value) {
    return <span {...stylex.props(styles.empty)}>–</span>;
  }

  return <>{value}</>;
}

export default function DemoPage(): JSX.Element {
  const [rows, setRows] = useState<Row[]>([]);
  const nextId = useRef(1);

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
        Kokeiluversio. Mitään ei tallenneta – tyhjennä taulukko lataamalla sivu uudelleen.
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
                {columns.map((column) => (
                  <td key={column.field} {...stylex.props(styles.td)}>
                    <Cell value={row[column.field] as string | null} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
