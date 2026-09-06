import { useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { requestMagicLink } from '~/features/auth/requestMagicLink.server';
import SignInPage, { type SignInActionData } from '~/features/auth/SignInPage';
import { signInWithForm } from '~/features/auth/signInWithForm.server';

import type { JSX } from 'react';

export function loader({ request }: LoaderFunctionArgs) {
  // Set by /auth/callback when a mailed link turns out to be spent or altered.
  return { linkFailed: new URL(request.url).searchParams.get('error') === 'magic-link' };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  if (form.get('intent') === 'magic') {
    return requestMagicLink(request, form.get('email'));
  }

  return signInWithForm(request, form);
}

export default function SignInRoute(): JSX.Element {
  const { linkFailed } = useLoaderData<typeof loader>();
  const result = useActionData<SignInActionData>();

  return <SignInPage result={result} linkFailed={linkFailed} />;
}
