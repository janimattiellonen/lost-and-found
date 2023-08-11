import {ClubDTO} from "~/types";

export const toDTO = (raw: any): ClubDTO => {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    name: raw.name,
    syncLog: raw.sync_log ?{
      id: raw.sync_log.id,
      clubId: raw.sync_log.club_id,
      updatedAt: raw.sync_log.updated_at
    } : undefined
  };
};
