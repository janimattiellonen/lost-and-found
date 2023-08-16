import {createSupabaseServerClient} from "~/models/utils";

import {toDTO} from "~/models/EmptyingLogMapper";

export async function getEmptyingLogItems(request: Request){
  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from("emptying_log")
    .select("id, created_at, emptied_at, club_id, course_name")


  console.log(`data: ${JSON.stringify(data,null,2)}`)
  console.log(`error: ${JSON.stringify(error,null,2)}`)

  return data ? data.map((row: any) => {
    return toDTO(row);
  }) : [];
}

export async function markAsEmptied(courseId: number, request: Request) {
  const supabase = createSupabaseServerClient(request);

  console.log(`markAsEmptied, id: ${courseId}`);

  const { error } = await supabase
    .from('emptying_log')
    .update({ emptied_at: 'now()'})
    .eq('id', courseId)

  console.log(`markAsEmptied, error: ${JSON.stringify(error, null,2)}`)

  return []
}

export async function getEmptyingLogItemsForClub(clubId: number, request: Request) {
  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from("emptying_log")
    .select("id, created_at, club_id, course_name, emptied_at")
    .eq('club_id', clubId)

  console.log(`getEmptyingTime, courseId: ${clubId}, data: ${JSON.stringify(data,null,2)}`)

  return data ? data.map((row: any) => {
    return toDTO(row);
  }) : [];

}
