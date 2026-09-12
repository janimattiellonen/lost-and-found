import { isDisposalMethod, isReturnMethod, type DisposalMethodValue, type ReturnMethodValue } from '~/discMethods';
import { MAX_ADDITIONAL_INFO_LENGTH, MAX_FIELD_LENGTH } from '~/features/discs/submission/toDiscDTO';
import { isIsoDate } from '~/lib/api/validate';

/**
 * Every column of one disc the edit form may write, in the shape the form works
 * in rather than the database's.
 *
 * Deliberately not the whole DiscDTO: external_id, internal_disc_id, club_id,
 * added_at, owner_link_token and archived_at are identity or bookkeeping, not an
 * admin's to retype, and the two `*_text` columns are Google Sheet history the
 * other disc actions leave alone as well.
 */
export type DiscEditValues = {
  /** Carries the plastic too, joined as "Destroyer, Star". Never empty. */
  discName: string;
  /** Empty is stored as '' rather than null: the column is NOT NULL. */
  discColour: string;
  discManufacturer: string | null;
  ownerName: string | null;
  ownerPhoneNumber: string | null;
  course: string | null;
  additionalInfo: string | null;
  isReturnedToOwner: boolean;
  /** ISO date, y-MM-dd. Null whenever isReturnedToOwner is false. */
  returnedToOwnerDate: string | null;
  returnMethod: ReturnMethodValue | null;
  canBeSoldOrDonated: boolean;
  /** ISO date, y-MM-dd. Null whenever canBeSoldOrDonated is false. */
  canBeSoldOrDonatedDate: string | null;
  canBeSoldOrDonatedMethod: DisposalMethodValue | null;
};

/**
 * One Finnish message per offending field, plus `form` for a complaint about the
 * combination rather than any single field.
 */
export type DiscEditErrors = Partial<Record<keyof DiscEditValues | 'form', string>>;

/**
 * Either the values ready to write or the messages to show. Both members carry
 * the other key as `undefined`, so `result.errors` narrows the union and a
 * caller can reach for `result.values?` without a cast.
 */
export type DiscEditResult =
  | { values: DiscEditValues; errors?: undefined }
  | { values?: undefined; errors: DiscEditErrors };

/** The form control names, kept in one place so the page and the parser agree. */
export const fieldNames = {
  discName: 'disc-name',
  discColour: 'disc-colour',
  discManufacturer: 'disc-manufacturer',
  ownerName: 'owner-name',
  ownerPhoneNumber: 'owner-phone-number',
  course: 'course',
  additionalInfo: 'additional-info',
  isReturnedToOwner: 'is-returned-to-owner',
  returnedToOwnerDate: 'returned-to-owner-date',
  returnMethod: 'return-method',
  canBeSoldOrDonated: 'can-be-sold-or-donated',
  canBeSoldOrDonatedDate: 'can-be-sold-or-donated-date',
  canBeSoldOrDonatedMethod: 'can-be-sold-or-donated-method',
} as const satisfies Record<keyof DiscEditValues, string>;

/**
 * Reads and checks the whole edit form, returning either the values ready to
 * write or a message per bad field.
 *
 * `allowedCourses` are the course names this club collects from. Anything else
 * is refused rather than written through: a stray value would show up as an
 * extra option in the list page's course filter, which is the same reason the
 * submission form checks it.
 *
 * Pure, so the rules can be tested without a database or a request.
 */
export function validateDiscEdit(form: FormData, allowedCourses: string[]): DiscEditResult {
  const errors: DiscEditErrors = {};

  function text(field: keyof DiscEditValues, maxLength = MAX_FIELD_LENGTH): string {
    const raw = form.get(fieldNames[field]);
    const value = typeof raw === 'string' ? raw.trim() : '';

    if (value.length > maxLength) {
      errors[field] = `Kenttä on liian pitkä (enintään ${maxLength} merkkiä).`;
    }

    return value;
  }

  // An unticked checkbox is simply absent from the submission.
  function checkbox(field: keyof DiscEditValues): boolean {
    return form.get(fieldNames[field]) != null;
  }

  const discName = text('discName');

  if (discName.length === 0) {
    errors.discName = 'Kiekon nimi on pakollinen.';
  }

  const course = text('course');

  if (course.length > 0 && !allowedCourses.includes(course)) {
    errors.course = `Tuntematon rata "${course}".`;
  }

  const isReturnedToOwner = checkbox('isReturnedToOwner');
  const canBeSoldOrDonated = checkbox('canBeSoldOrDonated');

  // Not enforced by the schema, only here: a disc that went home was not also
  // sold, and the statistics count the two as separate endings.
  if (isReturnedToOwner && canBeSoldOrDonated) {
    errors.form = 'Kiekko ei voi olla sekä palautettu että myytävissä tai lahjoitettavissa.';
  }

  /**
   * The date beside a mark: required while its box is ticked, and cleared
   * altogether while it is not, so an unticked disc carries no leftover date.
   */
  function markDate(field: 'returnedToOwnerDate' | 'canBeSoldOrDonatedDate', isMarked: boolean): string | null {
    if (!isMarked) {
      return null;
    }

    const value = text(field);

    if (value.length === 0) {
      errors[field] = 'Päivämäärä on pakollinen.';
      return null;
    }

    if (!isIsoDate(value)) {
      errors[field] = 'Virheellinen päivämäärä.';
      return null;
    }

    return value;
  }

  /** The method beside a mark. Null is the deliberate "not recorded". */
  function markMethod<V extends number>(
    field: 'returnMethod' | 'canBeSoldOrDonatedMethod',
    isMarked: boolean,
    isKnown: (value: unknown) => value is V,
  ): V | null {
    if (!isMarked) {
      return null;
    }

    const value = text(field);

    if (value.length === 0) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);

    if (!isKnown(parsed)) {
      errors[field] = 'Virheellinen tapa.';
      return null;
    }

    return parsed;
  }

  const returnedToOwnerDate = markDate('returnedToOwnerDate', isReturnedToOwner);
  const canBeSoldOrDonatedDate = markDate('canBeSoldOrDonatedDate', canBeSoldOrDonated);

  const values: DiscEditValues = {
    discName,
    discColour: text('discColour'),
    discManufacturer: orNull(text('discManufacturer')),
    ownerName: orNull(text('ownerName')),
    // Deliberately not format-checked: imported rows hold things like
    // "050 123 4567 (äiti)", and a pattern would block the admin from saving
    // the very row they came here to fix.
    ownerPhoneNumber: orNull(text('ownerPhoneNumber')),
    course: orNull(course),
    additionalInfo: orNull(text('additionalInfo', MAX_ADDITIONAL_INFO_LENGTH)),
    isReturnedToOwner,
    returnedToOwnerDate,
    returnMethod: markMethod('returnMethod', isReturnedToOwner, isReturnMethod),
    canBeSoldOrDonated,
    canBeSoldOrDonatedDate,
    canBeSoldOrDonatedMethod: markMethod('canBeSoldOrDonatedMethod', canBeSoldOrDonated, isDisposalMethod),
  };

  return Object.keys(errors).length > 0 ? { errors } : { values };
}

function orNull(value: string): string | null {
  return value.length === 0 ? null : value;
}
