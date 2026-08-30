import type { DbDiscType, DiscDTO } from '~/types';
import { isDisposalMethod } from '~/features/discs/disposal/disposalMethod';
import { isReturnMethod } from '~/features/discs/return/returnMethod';

function isEmpty(str?: string | null): boolean {
  return !str || str.length === 0;
}

export const toDTO = (raw: any): DiscDTO => {
  return {
    id: raw.id,
    externalId: raw.external_id,
    internalDiscId: raw.internal_disc_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    discName: raw.disc_name,
    discColour: raw.disc_colour,
    discManufacturer: raw.disc_manufacturer,
    ownerName: raw.owner_name,
    ownerPhoneNumber: raw.owner_phone_number,
    ownerClubName: raw.owner_club_name,
    addedAt: raw.added_at,
    additionalInfo: raw.additional_info,
    isReturnedToOwner: !isEmpty(raw.is_returned_to_owner) ? true : false,
    returnedToOwnerText: raw.returned_to_owner_text,
    returnedToOwnerDate: raw.returned_to_owner_date,
    // Narrowed rather than asserted: the CHECK constraint should make an
    // out-of-range value impossible, so treat one as unanswered if it happens.
    returnMethod: isReturnMethod(raw.return_method) ? raw.return_method : null,
    canBeSoldOrDonated: !isEmpty(raw.can_be_sold_or_donated) ? true : false,
    // Was reading raw.can_be_sold_or_donated, the boolean, so the text never
    // arrived and the DTO carried a boolean in a string field.
    canBeSoldOrDonatedText: raw.can_be_sold_or_donated_text,
    canBeSoldOrDonatedDate: raw.can_be_sold_or_donated_date,
    canBeSoldOrDonatedMethod: isDisposalMethod(raw.can_be_sold_or_donated_method)
      ? raw.can_be_sold_or_donated_method
      : null,
    clubId: raw.club_id,
    course: raw.course,
    notifiedAt: raw.notified_at,
  };
};

export const fromDTO = (discDTO: DiscDTO): DbDiscType => {
  return {
    id: discDTO.id,
    external_id: discDTO.externalId,
    internal_disc_id: discDTO.internalDiscId,
    created_at: discDTO.createdAt,
    updated_at: discDTO.updatedAt,
    disc_name: discDTO.discName,
    disc_colour: discDTO.discColour,
    disc_manufacturer: discDTO.discManufacturer,
    owner_name: discDTO.ownerName,
    owner_phone_number: discDTO.ownerPhoneNumber,
    owner_club_name: discDTO.ownerClubName,
    added_at: discDTO.addedAt,
    additional_info: discDTO.additionalInfo,
    is_returned_to_owner: discDTO.isReturnedToOwner,
    returned_to_owner_text: discDTO.returnedToOwnerText,
    returned_to_owner_date: discDTO.returnedToOwnerDate,
    return_method: discDTO.returnMethod,
    can_be_sold_or_donated: discDTO.canBeSoldOrDonated,
    can_be_sold_or_donated_text: discDTO.canBeSoldOrDonatedText,
    can_be_sold_or_donated_date: discDTO.canBeSoldOrDonatedDate,
    can_be_sold_or_donated_method: discDTO.canBeSoldOrDonatedMethod,
    club_id: discDTO.clubId,
    course: discDTO.course,
    notified_at: discDTO.notifiedAt,
  };
};
