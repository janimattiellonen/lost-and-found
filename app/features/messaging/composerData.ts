import type { DiscDTO, MessageLogDTO } from '~/types';

/**
 * Exactly the disc fields the message form shows or substitutes into a
 * template. Picked from the DTO, so a full disc is still assignable where one
 * of these is wanted, and a loader can send these fields and no others.
 */
export type ComposerDisc = Pick<
  DiscDTO,
  'externalId' | 'discName' | 'discColour' | 'ownerName' | 'ownerPhoneNumber' | 'notifiedAt'
>;

/** Exactly the fields the sent-message history shows. */
export type ComposerMessage = Pick<MessageLogDTO, 'content' | 'sentAt'>;
