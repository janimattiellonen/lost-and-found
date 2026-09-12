import type { DiscDTO, MessageLogDTO } from '~/types';

/**
 * Exactly the disc fields the message form shows or substitutes into a
 * template. Picked from the DTO, so a full disc is still assignable where one
 * of these is wanted, and a loader can send these fields and no others.
 */
export type ComposerDisc = Pick<
  DiscDTO,
  | 'externalId'
  | 'discName'
  | 'discColour'
  | 'course'
  | 'ownerName'
  | 'ownerPhoneNumber'
  | 'notifiedAt'
  | 'ownerLinkToken'
>;

/** Exactly the fields the sent-message history shows. */
export type ComposerMessage = Pick<MessageLogDTO, 'content' | 'sentAt'>;

/**
 * Narrows a disc to exactly the fields the composer needs.
 *
 * The batch page used to list these fields by hand, and a dropped `course` left
 * `[course]` and `[courses]` empty in every batch message while the one-disc
 * page filled them in. Nearly every `DiscDTO` field is optional, so an object
 * literal missing one is still a valid `ComposerDisc` and the compiler says
 * nothing -- hence one narrowing, here, with the check below to keep it whole.
 *
 * `satisfies` rather than a return annotation: it checks the literal against
 * `ComposerDisc` while keeping the keys it actually has, which is what
 * `UncopiedField` then reads.
 */
export function toComposerDisc(disc: DiscDTO) {
  return {
    externalId: disc.externalId,
    discName: disc.discName,
    discColour: disc.discColour,
    course: disc.course,
    ownerName: disc.ownerName,
    ownerPhoneNumber: disc.ownerPhoneNumber,
    notifiedAt: disc.notifiedAt,
    ownerLinkToken: disc.ownerLinkToken,
  } satisfies ComposerDisc;
}

/** Any `ComposerDisc` field `toComposerDisc` forgot to copy. */
type UncopiedField = Exclude<keyof ComposerDisc, keyof ReturnType<typeof toComposerDisc>>;

/**
 * Fails to compile unless `toComposerDisc` copies every field.
 *
 * Adding a token to the message grammar means adding its field to
 * `ComposerDisc`; without this, forgetting the matching line in
 * `toComposerDisc` typechecks and ships, which is the bug that was fixed here.
 * A test cannot hold this -- it would have to list the fields by hand itself,
 * which is the very copying at fault. The error names the missing field.
 */
export const everyComposerFieldIsCopied: [UncopiedField] extends [never]
  ? true
  : ['toComposerDisc does not copy', UncopiedField] = true;
