import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export function createConnection() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_KEY!;

  return createClient(supabaseUrl, supabaseKey);
}

export function createFunctionConnection() {
  const supabaseUrl = process.env.SUPABASE_URL!;

  const supabaseKey = process.env.SUPABASE_KEY!;

  return createClient(supabaseUrl, supabaseKey);
}

// Builds a request-scoped Supabase client. Cookie writes (e.g. a session
// refresh or sign-in) are collected onto `headers`; callers that establish or
// refresh a session must return those headers on their response so the browser
// stores the updated auth cookies.
export function createSupabaseServerClientWithHeaders(request: Request): {
  supabase: SupabaseClient;
  headers: Headers;
} {
  const headers = new Headers();

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '').map(({ name, value }) => ({
          name,
          value: value ?? '',
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options)),
        );
      },
    },
  });

  return { supabase, headers };
}

// Read-only convenience for the many model functions that only need an
// auth-scoped client for RLS queries. Cookie writes are intentionally dropped
// here (these requests don't return Supabase's Set-Cookie headers), matching
// the prior @supabase/auth-helpers-remix behaviour.
export function createSupabaseServerClient(request: Request): SupabaseClient {
  return createSupabaseServerClientWithHeaders(request).supabase;
}

export async function isUserLoggedIn(request: Request): Promise<boolean> {
  const supabase = createSupabaseServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id != null;
}
