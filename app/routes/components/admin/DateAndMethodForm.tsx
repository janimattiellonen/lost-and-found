import { useState, type FormEvent, type JSX } from 'react';

import { format } from 'date-fns';

/** One radio option: the value that gets persisted, and its Finnish label. */
export type MethodOption<V extends number = number> = { value: V; label: string };

// Generic over the method's own value type, so a caller passing
// returnMethodOptions gets a ReturnMethodValue back rather than a bare number.
type DateAndMethodFormProps<V extends number> = {
  /** Names the disc the form is acting on, e.g. "Merkitse palautetuksi". */
  title: string;
  discName: string;
  /** Distinguishes this form's field ids and radio group from any other on the page. */
  idPrefix: string;
  dateLabel: string;
  methodLabel: string;
  options: MethodOption<V>[];
  submitLabel: string;
  /** Resolves to null on success, or to a message to show in the form. */
  onSubmit: (date: string, method: V | null) => Promise<string | null>;
  onCancel: () => void;
};

/**
 * The shape both admin marks share: a date defaulting to today, an optional
 * method picked from radios, and Submit/Cancel.
 *
 * The method is nullable in the database, so it can be cleared back to
 * unanswered after a radio has been picked.
 */
export default function DateAndMethodForm<V extends number>({
  title,
  discName,
  idPrefix,
  dateLabel,
  methodLabel,
  options,
  submitLabel,
  onSubmit,
  onCancel,
}: DateAndMethodFormProps<V>): JSX.Element {
  const [date, setDate] = useState(() => format(new Date(), 'y-MM-dd'));
  const [method, setMethod] = useState<V | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setIsSaving(true);
    setError(null);

    const message = await onSubmit(date, method);

    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6 py-2">
      <p className="basis-full text-xs text-gray-600">
        {title}: <b>{discName}</b>
      </p>

      <div>
        <label htmlFor={`${idPrefix}-date`} className="block text-xs font-bold text-gray-600 mb-1">
          {dateLabel}
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.currentTarget.value)}
          className="border border-gray-300 rounded px-2 py-1"
        />
      </div>

      <fieldset>
        <legend className="text-xs font-bold text-gray-600 mb-1">{methodLabel}</legend>
        <div className="flex items-center gap-4">
          {options.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-1">
              <input
                type="radio"
                name={`${idPrefix}-method`}
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
              />
              {option.label}
            </label>
          ))}

          <button
            type="button"
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
          {isSaving ? 'Tallennetaan...' : submitLabel}
        </button>

        <button type="button" onClick={onCancel} className="border border-gray-300 hover:bg-gray-100 rounded px-3 py-1">
          Peruuta
        </button>
      </div>

      {error && <p className="basis-full text-red-700">{error}</p>}
    </form>
  );
}
