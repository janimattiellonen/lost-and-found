import {DbDiscType, DiscDTO} from "~/types";

import {format, parse} from "date-fns";

function isEmpty(str?: string | null): boolean {
  return !str || str.length === 0
}
export const toDTO = (raw: any): DiscDTO => {
  format(parse("19.6.2023", "d.M.y", new Date()), "d.M.y")
  return {
    internalDiscId: raw.internal_disc_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    discName: raw.disc_name,
    discColour: raw.disc_colour,
    ownerName: raw.owner_name,
    ownerPhoneNumber: raw.owner_phone_number,
    ownerClubName: raw.owner_club_name,
    addedAt: raw.added_at,
    additionalInfo: raw.additional_info,
    isReturnedToOwner: !isEmpty(raw.is_returned_to_owner) ? true : false,
    returnedToOwnerText: raw.is_returned_to_owner,
    canBeSoldOrDonated: !isEmpty(raw.can_be_sold_or_donated) ? true : false,
    canBeSoldOrDonatedText: raw.can_be_sold_or_donated,
    clubId: raw.club_id,
    course: raw.course,
  };
};

export const fromDto = (discDTO: DiscDTO): DbDiscType => {
  return {
    id: discDTO.id,
    internal_disc_id: discDTO.internalDiscId,
    created_at: discDTO.createdAt,
    updated_at: discDTO.updatedAt,
    disc_name: discDTO.discName,
    disc_colour: discDTO.discColour,
    owner_name: discDTO.ownerName,
    owner_phone_number: discDTO.ownerPhoneNumber,
    owner_club_name: discDTO.ownerClubName,
    added_at: discDTO.addedAt,
    additional_info: discDTO.additionalInfo,
    is_returned_to_owner: discDTO.isReturnedToOwner,
    returned_to_owner_text: discDTO.returnedToOwnerText,
    can_be_sold_or_donated: discDTO.canBeSoldOrDonated,
    can_be_sold_or_donated_text: discDTO.canBeSoldOrDonatedText,
    club_id: discDTO.clubId,
    course: discDTO.course,
  }
}
