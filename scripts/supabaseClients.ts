/**
 * Supabase clients for the command-line scripts.
 *
 * Kept free of `~/` imports so the scripts run under plain node's TypeScript
 * stripping, the same reason app/import/puskasoturitDiscFields.ts avoids them.
 */
import { createClient } from '@supabase/supabase-js';

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.`);
  }

  return value;
}

/** Reading is public, so the anon key is enough for it. */
export function createReadConnection() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_KEY'));
}

/**
 * A client allowed to write. Row-level security on `discs` only lets
 * authenticated users insert or update, and the anon key is not one — the app
 * writes with the signed-in user's session, which a script has to arrange for
 * itself.
 *
 * Either put SUPABASE_SERVICE_ROLE_KEY in .env (it bypasses RLS), or sign in
 * with an admin account through SUPABASE_EMAIL / SUPABASE_PASSWORD.
 */
export async function createWriteConnection() {
  const url = requireEnv('SUPABASE_URL');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    console.log('Writing with the service role key.');
    return createClient(url, serviceRoleKey);
  }

  const email = process.env.SUPABASE_EMAIL;
  const password = process.env.SUPABASE_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Writing needs more than the anon key. Set SUPABASE_SERVICE_ROLE_KEY in .env, ' +
        'or SUPABASE_EMAIL and SUPABASE_PASSWORD for an admin account.',
    );
  }

  const supabase = createClient(url, requireEnv('SUPABASE_KEY'));

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(`Signing in as ${email} failed: ${error.message}`);
  }

  console.log(`Writing as ${email}.`);

  return supabase;
}
