import {EmptyingLogDTO} from "~/types";

export const toDTO = (raw: any): EmptyingLogDTO => {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    clubId: raw.club_id,
    courseName: raw.course_name,
    emptiedAt: raw.emptied_at,
  };
};
