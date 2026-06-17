import { Form, useActionData, useOutletContext } from 'react-router';

import type { ActionFunctionArgs } from 'react-router';
import { data, redirect } from 'react-router';

import { createSupabaseServerClientWithHeaders } from '~/models/utils';

import Button from '~/routes/components/Button';

import Label from './components/Label';

import type { JSX } from "react";

type LoginErrors = {
  password?: string | null | undefined;
  email?: string | null | undefined;
  invalidLogin?: boolean | null | undefined;
};
export async function action({ request }: ActionFunctionArgs) {
  const errors: LoginErrors = {};

  const { supabase, headers } = createSupabaseServerClientWithHeaders(request);

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
      return data(errors, { status: 422 });
    }

    return redirect('/', {
      status: 302,
      headers,
    });
  } catch (error) {
    console.log(`ERROR: ${JSON.stringify(error, null, 2)}`);
  }
}
type SignInPageProps = {
  user?: { email?: string } | null;
};

type OutletContext = {
  supabase: { auth: { signOut: () => Promise<unknown> } };
};

export default function SignInPage({ user }: SignInPageProps): JSX.Element {
  const errors = useActionData<LoginErrors>();
  const { supabase } = useOutletContext<OutletContext>();

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
          <Label htmlFor="email">Sähköpostiosoite</Label>
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
          <Label htmlFor="password">Salasana</Label>
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
