import { data, redirect } from 'react-router';

import { createSupabaseServerClientWithHeaders } from '~/models/utils';

export type LoginErrors = {
  password?: string | null | undefined;
  email?: string | null | undefined;
  invalidLogin?: boolean | null | undefined;
};

/** Signs the user in from the posted credentials, or replies with errors. */
export async function signInWithForm(request: Request) {
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
