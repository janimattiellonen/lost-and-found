import { useState, type JSX } from 'react';

import { Form, useNavigation } from 'react-router';

import { disposalMethodOptions, returnMethodOptions } from '~/discMethods';
import { fieldNames, type DiscEditErrors, type DiscEditValues } from '~/features/discs/edit/discEdit';
import { MAX_ADDITIONAL_INFO_LENGTH, MAX_FIELD_LENGTH } from '~/features/discs/fieldLimits';
import Button from '~/ui/Button';
import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import type { MethodOption } from '~/lib/methodEnum';
import Select, { MenuItem } from '~/ui/Select';
import SuccessNote from '~/ui/SuccessNote';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

type Props = {
  disc: DiscEditValues;
  /** The courses this club files discs under; empty for a single-course club. */
  courses: string[];
  errors?: DiscEditErrors | null;
  /** The save this page's own action just made. */
  saved?: boolean;
};

// The value the "no course" and "no method" options carry. Empty so neither can
// collide with a real course name or a stored method number.
const NONE = '';

/**
 * The whole of one disc on one page: what it is, whose it is, and how its story
 * ended.
 *
 * The fields are uncontrolled except the two lifecycle checkboxes, which decide
 * whether their date and method are shown at all. Everything else is seeded
 * with defaultValue and left to the browser — the page is remounted per disc,
 * so there is nothing to keep in sync afterwards.
 */
export default function EditDiscPage({ disc, courses, errors, saved }: Props): JSX.Element {
  const [isReturnedToOwner, setIsReturnedToOwner] = useState(disc.isReturnedToOwner);
  const [canBeSoldOrDonated, setCanBeSoldOrDonated] = useState(disc.canBeSoldOrDonated);
  // Typing after a save makes the "saved" line a lie -- what is on screen is no
  // longer what is stored -- so the first edit takes it away again.
  const [isEdited, setIsEdited] = useState(false);

  const navigation = useNavigation();
  const isSaving = navigation.state !== 'idle' && navigation.formData != null;

  return (
    <div>
      <H2 className="mt-8 mb-4">Muokkaa kiekon tietoja</H2>

      <SuccessNote className="mb-4">{!isEdited && !isSaving && saved && 'Kiekon tiedot tallennettu.'}</SuccessNote>

      {errors?.form && <p className="mb-4 text-red-500 text-sm">{errors.form}</p>}

      <Form
        method="post"
        onChange={() => {
          setIsEdited(true);
        }}
        onSubmit={() => {
          setIsEdited(false);
        }}
      >
        <TextRow
          field="discName"
          label="Kiekko"
          hint="Kiekon nimi ja muovi kirjoitetaan yhteen kenttään pilkulla erotettuna, esim. ”Destroyer, Star”."
          value={disc.discName}
          error={errors?.discName}
        />

        <TextRow field="discColour" label="Väri" value={disc.discColour} error={errors?.discColour} />

        <TextRow
          field="discManufacturer"
          label="Valmistaja"
          value={disc.discManufacturer}
          error={errors?.discManufacturer}
        />

        <TextRow field="ownerName" label="Omistaja" value={disc.ownerName} error={errors?.ownerName} />

        <TextRow
          field="ownerPhoneNumber"
          label="Puhelinnumero"
          value={disc.ownerPhoneNumber}
          error={errors?.ownerPhoneNumber}
        />

        {courses.length > 0 && (
          <Wrapper>
            <Label htmlFor={fieldNames.course}>Rata</Label>
            <Select id={fieldNames.course} name={fieldNames.course} defaultValue={disc.course ?? NONE} fullWidth>
              <MenuItem value={NONE}>Ei radan tietoa</MenuItem>
              {courses.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>

            <FieldError message={errors?.course} />
          </Wrapper>
        )}

        <Wrapper>
          <Label htmlFor={fieldNames.additionalInfo}>Lisätiedot</Label>
          <TextField
            id={fieldNames.additionalInfo}
            name={fieldNames.additionalInfo}
            multiline
            rows={4}
            fullWidth
            defaultValue={disc.additionalInfo ?? ''}
          />
          <p className="mt-1 text-xs text-gray-500">
            Seuran sisäinen muistiinpano. Ei näy julkisella listalla. Enintään {MAX_ADDITIONAL_INFO_LENGTH} merkkiä.
          </p>

          <FieldError message={errors?.additionalInfo} />
        </Wrapper>

        {/* Both marks take a disc off the public list, so they sit apart from
            the fields that only describe it. Ticking one is the same write the
            list's row actions make; unticking is the only way back. */}
        <MarkSection
          mark={{
            label: 'Palautettu omistajalle',
            checkboxField: 'isReturnedToOwner',
            dateField: 'returnedToOwnerDate',
            dateValue: disc.returnedToOwnerDate,
            methodField: 'returnMethod',
            methodLabel: 'Palautustapa',
            methodValue: disc.returnMethod,
            options: returnMethodOptions,
          }}
          isMarked={isReturnedToOwner}
          onToggle={setIsReturnedToOwner}
          errors={errors}
        />

        <MarkSection
          mark={{
            label: 'Myytävissä tai lahjoitettavissa',
            checkboxField: 'canBeSoldOrDonated',
            dateField: 'canBeSoldOrDonatedDate',
            dateValue: disc.canBeSoldOrDonatedDate,
            methodField: 'canBeSoldOrDonatedMethod',
            methodLabel: 'Tapa',
            methodValue: disc.canBeSoldOrDonatedMethod,
            options: disposalMethodOptions,
          }}
          isMarked={canBeSoldOrDonated}
          onToggle={setCanBeSoldOrDonated}
          errors={errors}
        />

        <div className="flex justify-start gap-4">
          <Button color="error" variant="contained" to="/">
            Peru
          </Button>

          <Button variant="contained" type="submit" disabled={isSaving}>
            {isSaving ? 'Tallennetaan...' : 'Tallenna muutokset'}
          </Button>
        </div>
      </Form>
    </div>
  );
}

type TextRowProps = {
  field: keyof typeof fieldNames;
  label: string;
  hint?: string;
  value: string | null;
  error?: string;
};

/** One labelled single-line field, which is most of this form. */
function TextRow({ field, label, hint, value, error }: TextRowProps): JSX.Element {
  const name = fieldNames[field];

  return (
    <Wrapper>
      <Label htmlFor={name}>{label}</Label>
      <TextField
        id={name}
        name={name}
        fullWidth
        defaultValue={value ?? ''}
        inputProps={{ maxLength: MAX_FIELD_LENGTH }}
      />

      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}

      <FieldError message={error} />
    </Wrapper>
  );
}

/**
 * One end-of-life mark as the form offers it: the Finnish words, which three
 * fields it is made of, and what is stored in them today.
 *
 * A type rather than eleven props, because the return and the disposal are the
 * same shape twice over and the call sites had started to read as a column of
 * near-identical strings.
 */
type Mark = {
  label: string;
  checkboxField: 'isReturnedToOwner' | 'canBeSoldOrDonated';
  dateField: 'returnedToOwnerDate' | 'canBeSoldOrDonatedDate';
  dateValue: string | null;
  methodField: 'returnMethod' | 'canBeSoldOrDonatedMethod';
  methodLabel: string;
  methodValue: number | null;
  options: MethodOption[];
};

type MarkSectionProps = {
  mark: Mark;
  isMarked: boolean;
  onToggle: (isMarked: boolean) => void;
  errors?: DiscEditErrors | null;
};

/**
 * One end-of-life mark: the tick, and the date and method that only mean
 * anything while it is ticked.
 *
 * The date and method are unmounted rather than disabled when the box is
 * unticked, so nothing is posted for them — which is what the action reads as
 * "clear these columns".
 */
function MarkSection({ mark, isMarked, onToggle, errors }: MarkSectionProps): JSX.Element {
  const dateName = fieldNames[mark.dateField];
  const methodName = fieldNames[mark.methodField];

  return (
    <Wrapper>
      <FormControlLabel
        control={
          <Checkbox
            name={fieldNames[mark.checkboxField]}
            value={isMarked}
            checked={isMarked}
            onChange={(event) => {
              onToggle(event.target.checked);
            }}
          />
        }
        label={mark.label}
      />

      {isMarked && (
        <div className="flex flex-wrap items-end gap-6 mt-2">
          <div>
            <Label htmlFor={dateName}>Päivämäärä</Label>
            <TextField id={dateName} name={dateName} type="date" defaultValue={mark.dateValue ?? ''} />

            <FieldError message={errors?.[mark.dateField]} />
          </div>

          <div>
            <Label htmlFor={methodName}>{mark.methodLabel}</Label>
            <Select
              id={methodName}
              name={methodName}
              defaultValue={mark.methodValue == null ? NONE : String(mark.methodValue)}
            >
              <MenuItem value={NONE}>Ei tietoa</MenuItem>
              {mark.options.map((option) => (
                <MenuItem key={option.value} value={String(option.value)}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>

            <FieldError message={errors?.[mark.methodField]} />
          </div>
        </div>
      )}
    </Wrapper>
  );
}

function FieldError({ message }: { message?: string }): JSX.Element | null {
  return message ? <p className="text-red-500 text-xs italic">{message}</p> : null;
}
