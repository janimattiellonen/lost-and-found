import { useState, type JSX } from 'react';

import InlineForm, { InlineFormOption, InlineFormOptions } from '../InlineForm';

import { retrievalMethodOptions, type RetrievalMethodValue } from './retrievalMethod';

type Props = {
  discName: string;
  /** Distinguishes this form's radio group from any other on the page. */
  idPrefix: string;
  /** Whether the disc is already on the list, whatever it is down for. */
  isOnList: boolean;
  /**
   * What the disc is already down for. Null when it is not on the list, and
   * also when it is on it because the club is keeping it — there is no method
   * to preselect, and picking one here is what turns it back into a return.
   */
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
export default function RetrievalMethodForm({
  discName,
  idPrefix,
  isOnList,
  current,
  onSubmit,
  onCancel,
}: Props): JSX.Element {
  const [retrievalMethod, setRetrievalMethod] = useState<RetrievalMethodValue | null>(current);

  return (
    <InlineForm
      title={
        <>
          {isOnList ? 'Muuta noutotapaa' : 'Lisää noutolistalle'}: <b>{discName}</b>
        </>
      }
      submitLabel={current === null ? 'Lisää noutolistalle' : 'Tallenna noutotapa'}
      canSubmit={retrievalMethod !== null}
      // `canSubmit` already keeps this from being called unanswered. The check
      // is here to tell the type checker so — and it throws rather than
      // returning, because `null` is how this handler reports success and a
      // silent "saved fine" is the wrong way to describe a broken invariant.
      onSubmit={async () => {
        if (retrievalMethod === null) {
          throw new Error('InlineForm submitted while canSubmit was false');
        }
        return onSubmit(retrievalMethod);
      }}
      onCancel={onCancel}
    >
      <InlineFormOptions legend="Omistaja haluaa kiekon">
        {retrievalMethodOptions.map((option) => (
          <InlineFormOption key={option.value}>
            <input
              type="radio"
              name={`${idPrefix}-method`}
              value={option.value}
              checked={retrievalMethod === option.value}
              onChange={() => setRetrievalMethod(option.value)}
            />
            {option.label}
          </InlineFormOption>
        ))}
      </InlineFormOptions>
    </InlineForm>
  );
}
