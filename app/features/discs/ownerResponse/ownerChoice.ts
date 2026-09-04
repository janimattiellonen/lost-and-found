import { methodEnum } from '~/lib/methodEnum';

/**
 * What the owner answers from the sms link.
 *
 * Stored as a smallint in disc_owner_responses.choice; see methodEnum for what
 * that means for changing these numbers.
 */
const ownerChoice = methodEnum({
  GivesUp: { value: 0, label: 'Antaa kiekon seuralle' },
  WantsItBack: { value: 1, label: 'Haluaa kiekon takaisin' },
});

export const OwnerChoice = ownerChoice.values;
export const isOwnerChoice = ownerChoice.is;
export const ownerChoiceLabel = ownerChoice.label;

export type OwnerChoiceValue = (typeof OwnerChoice)[keyof typeof OwnerChoice];
