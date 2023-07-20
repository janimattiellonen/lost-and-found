import {ClubDTO} from "~/types";

export const toDTO = (raw: any): ClubDTO => {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    name: raw.name
  };
};
