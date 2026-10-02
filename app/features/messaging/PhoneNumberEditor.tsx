import { useState, type FormEvent, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { saveOwnerPhoneNumber } from '~/features/messaging/saveOwnerPhoneNumber';
import Button from '~/ui/Button';
import FieldError from '~/ui/FieldError';
import Label from '~/ui/Label';
import TextField from '~/ui/TextField';
import { space } from '~/styles/tokens.stylex';

type Props = {
  externalId: string;
  /** What the field opens with: the number as stored, ungrouped. */
  phoneNumber: string;
  /** Called with the number as stored, once the save went through. */
  onSaved: (phoneNumber: string) => void;
  /** Peruuta: the editor closes and nothing is saved. Unavailable mid-save. */
  onCancel: () => void;
};

/**
 * The composer's inline editor for the owner's phone number.
 *
 * Saves to the disc itself, not just to the message being written, so a wrong
 * number fixed in the middle of a batch stays fixed. A refused save keeps the
 * editor open with the reason under the field, so what was typed is not lost.
 *
 * A number saved unchanged is not posted: the write would bump `updated_at`,
 * which reads as "edited by hand", for an edit that never happened.
 */
export default function PhoneNumberEditor({ externalId, phoneNumber, onSaved, onCancel }: Props): JSX.Element {
  const [value, setValue] = useState<string>(phoneNumber);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    // Not for an empty one: that goes to the server, which says it is required.
    if (phoneNumber !== '' && value.trim() === phoneNumber) {
      onSaved(phoneNumber);

      return;
    }

    setIsSaving(true);
    setError(null);

    // `finally`, as in InlineForm: should the save ever throw, the editor must
    // not sit saying it is saving for ever with both buttons dead.
    let result;

    try {
      result = await saveOwnerPhoneNumber({ externalId, phoneNumber: value });
    } finally {
      setIsSaving(false);
    }

    if (result.status === 'error') {
      setError(result.message);

      return;
    }

    onSaved(result.phoneNumber);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Label htmlFor="phone">Puhelinnumero</Label>
      <TextField
        id="phone"
        type="tel"
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputProps={{ autoFocus: true, autoComplete: 'off' }}
      />
      <FieldError>{error}</FieldError>

      <div {...stylex.props(styles.actions)}>
        <Button type="submit" variant="contained" size="small" disabled={isSaving}>
          {isSaving ? 'Tallennetaan...' : 'Tallenna'}
        </Button>
        {/* Not while saving: the post would land anyway, and a cancel that
            saved is worse than one that waits. */}
        <Button type="button" variant="outlined" size="small" onClick={onCancel} disabled={isSaving}>
          Peruuta
        </Button>
      </div>
    </form>
  );
}

const styles = stylex.create({
  actions: { display: 'flex', gap: space.sm, marginTop: space.sm },
});
