import { Form, useOutletContext } from 'react-router';

import type { LoginErrors } from '~/features/auth/signInWithForm.server';
import Button from '~/ui/Button';
import Label from '~/ui/Label';

import type { JSX } from 'react';

type Props = {
  user?: { email?: string } | null;
  errors?: LoginErrors | null;
};

type OutletContext = {
  supabase: { auth: { signOut: () => Promise<unknown> } };
};

export default function SignInPage({ user, errors }: Props): JSX.Element {
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
