import { useState, type FormEvent, type JSX } from 'react';

import { retrievalMethodOptions, type RetrievalMethodValue } from './retrievalMethod';

type Props = {
  discName: string;
  /** Distinguishes this form's radio group from any other on the page. */
  idPrefix: string;
  /** What the disc is already down for, when it is already on the list. */
  current: RetrievalMethodValue | null;
  /** Resolves to null on success, or to a message to show in the form. */
  onSubmit: (retrievalMethod: RetrievalMethodValue) => Promise<string | null>;
  onCancel: () => void;
};

/**
 * Puts one disc on the retrieval list, from inside the disc table.
 *
 * Asks for the method and nothing else: the date is now, and the disc's own
 * details are already in the row above. Unlike the return and disposal forms
 * the method cannot be left unanswered — a line on the list that does not say
 * post or hand-over is one the admin would have to go back to the messages for
 * — so there is no Submit until a radio is picked.
 *
 * A disc already on the list opens the same form with its method preselected,
 * which is how a "he'd rather collect it after all" is corrected.
 */
export default function RetrievalMethodForm({ discName, idPrefix, current, onSubmit, onCancel }: Props): JSX.Element {
  const [retrievalMethod, setRetrievalMethod] = useState<RetrievalMethodValue | null>(current);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (retrievalMethod === null) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const message = await onSubmit(retrievalMethod);

    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6 py-2">
      {/* Light text: the form opens inside the dark disc table. */}
      <p className="basis-full text-xs text-gray-300">
        {current === null ? 'Lisää noutolistalle' : 'Muuta noutotapaa'}: <b>{discName}</b>
      </p>

      <fieldset>
        <legend className="text-xs font-bold text-gray-300 mb-1">Omistaja haluaa kiekon</legend>
        <div className="flex items-center gap-4">
          {retrievalMethodOptions.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-1">
              <input
                type="radio"
                name={`${idPrefix}-method`}
                value={option.value}
                checked={retrievalMethod === option.value}
                onChange={() => setRetrievalMethod(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSaving || retrievalMethod === null}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white rounded px-3 py-1"
        >
          {isSaving ? 'Tallennetaan...' : current === null ? 'Lisää noutolistalle' : 'Tallenna noutotapa'}
        </button>

        <button type="button" onClick={onCancel} className="border border-gray-300 hover:bg-white/10 rounded px-3 py-1">
          Peruuta
        </button>
      </div>

      {error && <p className="basis-full text-red-300">{error}</p>}
    </form>
  );
}
