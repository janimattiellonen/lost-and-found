import type { HandoverMethod, HandoverMethodValue } from '~/features/discs/handoverMethod';
import type { OwnerChoice, OwnerChoiceValue } from './ownerChoice';

/** Where a posted disc goes. Only ever collected for a posting. */
export type ShippingAddress = {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  /** Empty means Finland. */
  country: string;
};

/**
 * One answer, in the only shapes it can take.
 *
 * A union rather than a record of optional fields: an address is
 * unrepresentable except alongside a posting, and a posting is unrepresentable
 * without one — the same pairing the CHECK constraints hold at the database
 * end.
 */
type GivesUp = typeof OwnerChoice.GivesUp;
type WantsItBack = typeof OwnerChoice.WantsItBack;
type ByMail = typeof HandoverMethod.ByMail;
type Collected = typeof HandoverMethod.PickedUpFromHome | typeof HandoverMethod.PickedUpFromStorage;

export type OwnerResponse =
  | { choice: GivesUp }
  | { choice: WantsItBack; handoverMethod: Collected }
  | { choice: WantsItBack; handoverMethod: ByMail; address: ShippingAddress }
  // Several discs waiting: what goes in the parcel, and so the postage and the
  // address, are settled by message instead.
  | { choice: WantsItBack; handoverMethod: ByMail; hasMoreDiscs: true };

/**
 * What the owner-facing page may show. Everything here is already on the club's
 * public disc list, which is why a forwarded link gives nothing away: see
 * docs/getting-a-disc-back-to-its-owner.md, section 2.
 */
export type OwnerLinkDisc = {
  discName: string;
  discColour: string;
  discManufacturer: string | null;
  /** The last four digits, so the owner recognises the disc as theirs. */
  phoneNumberEnding: string | null;
  /** Which handover methods this disc's location allows. */
  handoverMethods: HandoverMethodValue[];
};

/** One answer as the admin's page shows it. */
export type OwnerResponseSummary = {
  id: number;
  externalId: string;
  discName: string;
  discColour: string;
  ownerName: string | null;
  ownerPhoneNumber: string | null;
  choice: OwnerChoiceValue;
  handoverMethod: HandoverMethodValue | null;
  respondedAt: string;
  /** Present only for a posting whose address has not been wiped. */
  address: ShippingAddress | null;
  /** The owner has several discs waiting, so no address was asked for. */
  hasMoreDiscs: boolean;
};
