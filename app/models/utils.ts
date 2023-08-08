import {createClient, SupabaseClient} from "@supabase/supabase-js";
import { Database } from "../../schema";
import {createServerClient} from "@supabase/auth-helpers-remix";
import {request} from "websocket";

export function createConnection() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseKey);
}

export function createFunctionConnection() {
  const supabaseUrl = process.env.SUPABASE_URL!;

  const supabaseKey = process.env.SUPABASE_KEY!;

  return createClient(supabaseUrl, supabaseKey);
}


export function createSupabaseServerClient(request: Request) : SupabaseClient {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
  }

  const response = new Response()

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    request,
    response
  })

}


export async function isUserLoggedIn(request: Request): Promise<boolean> {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
  }
  const response = new Response()


  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    request,
    response,
  })

  const { data: { user } } = await supabase.auth.getUser()

  return user?.id != null
}
