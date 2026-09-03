import { useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { handleOwnerLinkSubmit } from '~/features/discs/ownerResponse/handleOwnerLinkSubmit.server';
import { loadOwnerLinkPage } from '~/features/discs/ownerResponse/loadOwnerLinkPage.server';
import OwnerLinkPage from '~/features/discs/ownerResponse/OwnerLinkPage';

import type { JSX } from 'react';

/**
 * The page an owner reaches from the link in the sms.
 *
 * No login: holding the link is the permission, and everything the page shows
 * is already on the club's public disc list. See
 * docs/getting-a-disc-back-to-its-owner.md.
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const token = params.token ?? '';

  return { ...(await loadOwnerLinkPage(token)), token };
};

export async function action({ request, params }: ActionFunctionArgs) {
  return handleOwnerLinkSubmit(params.token ?? '', await request.formData());
}

/**
 * Keeps the token out of the Referer header of anything the page leads to, and
 * out of search results.
 */
export const headers = () => ({
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
});

export default function OwnerLinkRoute(): JSX.Element {
  const { disc, clubPayment, contactEmail, token } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  return (
    <OwnerLinkPage disc={disc} clubPayment={clubPayment} contactEmail={contactEmail} token={token} result={result} />
  );
}
