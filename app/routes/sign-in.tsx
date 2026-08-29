import { useActionData, type ActionFunctionArgs } from 'react-router';

import SignInPage from '~/features/auth/SignInPage';
import { signInWithForm, type LoginErrors } from '~/features/auth/signInWithForm.server';

import type { JSX } from 'react';

export async function action({ request }: ActionFunctionArgs) {
  return signInWithForm(request);
}

export default function SignInRoute(): JSX.Element {
  const errors = useActionData<LoginErrors>();

  return <SignInPage errors={errors} />;
}
