import { Form, useActionData, useOutletContext } from '@remix-run/react';

import { ActionArgs, json, redirect } from '@remix-run/node';

import { createServerClient } from '@supabase/auth-helpers-remix';

import { Button } from '@mui/material';

type LoginErrors = {
  password?: string | null | undefined;
  email?: string | null | undefined;
  invalidLogin?: boolean | null | undefined;
};
export async function action({ request }: ActionArgs) {
  const errors: LoginErrors = {};

  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
  };

  const response = new Response();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    request,
    response,
  });

  try {
    const form = await request.formData();
    const email = form.get('email')!;
    const password = form.get('password')!;

    if (typeof email !== 'string' || email.length === 0) {
      errors.email = 'Käyttäjätunnus on pakollinen';
    }

    if (typeof password !== 'string' || password.length === 0) {
      errors.password = 'Salasana on pakollinen';
    }

    const result = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    });

    if (result?.error) {
      errors.invalidLogin = true;
    }

    if (Object.keys(errors).length) {
      return json(errors, { status: 422 });
    }

    return redirect('/', {
      status: 302,
      headers: response.headers,
    });
  } catch (error) {
    console.log(`ERROR: ${JSON.stringify(error, null, 2)}`);
  }
}
type SignInPageProps = {
  user?: object | null;
};

export default function SignInPage({ user }: SignInPageProps): JSX.Element {
  const errors = useActionData();
  const { supabase } = useOutletContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div>
      <h2 className="mb-4 font-bold text-xl">Kirjaudu sisään</h2>

      {user?.email && (
        <p>
          <button onClick={handleLogout}>Kirjaudu ulos</button>
        </p>
      )}

      <Form method="post">
        <div className="mb-2">
          <label className="text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Sähköpostiosoite
          </label>
          <input
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="email"
            placeholder="Sähköpostiosoite"
            name="email"
          />

          {errors?.email ? <p className="text-red-500 text-xs italic">{errors.email}</p> : null}
        </div>
        <div className="mb-2">
          <label className="text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Salasana
          </label>
          <input
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            name="password"
            placeholder="Salasana"
          />

          {errors?.password ? <p className="text-red-500 text-xs italic">{errors.password}</p> : null}
        </div>

        <div className="mb-2">
          {errors?.invalidLogin ? (
            <p className="text-red-500 text-xs italic">Virheellinen käyttäjätunnus tai salasana</p>
          ) : null}
        </div>

        <Button variant="contained" type="submit">
          Kirjaudu sisään
        </Button>
      </Form>
    </div>
  );
}
