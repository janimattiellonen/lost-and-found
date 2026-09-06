import { useState } from 'react';
import { Form, useNavigation, useOutletContext } from 'react-router';

import type { MagicLinkNotice } from '~/features/auth/requestMagicLink.server';
import type { LoginErrors } from '~/features/auth/signInWithForm.server';
import Button from '~/ui/Button';
import Label from '~/ui/Label';

import type { JSX } from 'react';

/** Either the password form's errors, or the magic link's neutral notice. */
export type SignInActionData = LoginErrors | MagicLinkNotice;

type Props = {
  user?: { email?: string } | null;
  result?: SignInActionData | null;
  /** A mailed link was spent, expired or altered; /auth/callback sent us here. */
  linkFailed?: boolean;
};

type OutletContext = {
  supabase: { auth: { signOut: () => Promise<unknown> } };
};

const inputClassName =
  'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline';

export default function SignInPage({ user, result, linkFailed }: Props): JSX.Element {
  const { supabase } = useOutletContext<OutletContext>();
  const navigation = useNavigation();
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const isMagicMode = mode === 'magic';
  const isSubmitting = navigation.state === 'submitting';

  // The two shapes the action can return; `notice` only ever comes back from a
  // link request, so its presence is what tells them apart.
  const notice = result && 'notice' in result ? result.notice : null;
  const errors = result && 'notice' in result ? null : result;

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

      {linkFailed && (
        <p className="mb-4 text-red-500 text-sm">
          Kirjautumislinkki on vanhentunut tai sitä on jo käytetty. Pyydä uusi linkki.
        </p>
      )}

      <Form method="post">
        <input type="hidden" name="intent" value={mode} />

        <div className="mb-2">
          <Label htmlFor="email">Sähköpostiosoite</Label>
          <input
            id="email"
            className={inputClassName}
            type="email"
            placeholder="Sähköpostiosoite"
            name="email"
            disabled={isSubmitting}
          />

          {errors?.email ? <p className="text-red-500 text-xs italic">{errors.email}</p> : null}
        </div>

        {!isMagicMode && (
          <div className="mb-2">
            <Label htmlFor="password">Salasana</Label>
            <input
              id="password"
              className={inputClassName}
              type="password"
              name="password"
              placeholder="Salasana"
              disabled={isSubmitting}
            />

            {errors?.password ? <p className="text-red-500 text-xs italic">{errors.password}</p> : null}
          </div>
        )}

        <div className="mb-2">
          {errors?.invalidLogin ? (
            <p className="text-red-500 text-xs italic">Virheellinen käyttäjätunnus tai salasana</p>
          ) : null}
        </div>

        <Button variant="contained" type="submit" disabled={isSubmitting}>
          {isMagicMode ? 'Lähetä kirjautumislinkki' : 'Kirjaudu sisään'}
        </Button>
      </Form>

      <p className="mt-4">
        <Button type="button" onClick={() => setMode(isMagicMode ? 'password' : 'magic')} disabled={isSubmitting}>
          {isMagicMode ? 'Kirjaudu salasanalla' : 'Kirjaudu sähköpostilinkillä'}
        </Button>
      </p>

      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </div>
  );
}
