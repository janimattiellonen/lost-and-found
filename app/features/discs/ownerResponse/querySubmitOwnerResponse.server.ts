import type { SupabaseClient } from '@supabase/supabase-js';

import { HandoverMethod } from '~/features/discs/handoverMethod';
import type { OwnerResponse } from './ownerResponse';

type Input = {
  token: string;
  response: OwnerResponse;
};

/**
 * Records one answer from the owner-facing page.
 *
 * Everything goes through submit_owner_response(), which resolves the token
 * itself: holding a valid link is the whole permission, and anon has no rights
 * on the table. 'unknown-token' covers a bad token and a disc the club has
 * already dealt with — the caller says the same thing for both.
 */
export async function querySubmitOwnerResponse(
  supabase: SupabaseClient,
  { token, response }: Input,
): Promise<'saved' | 'unknown-token'> {
  const address = response.choice === 1 && response.handoverMethod === HandoverMethod.ByMail ? response.address : null;

  const { error } = await supabase.rpc('submit_owner_response', {
    p_token: token,
    p_choice: response.choice,
    p_handover_method: response.choice === 1 ? response.handoverMethod : null,
    p_shipping_name: address?.name ?? null,
    p_shipping_street: address?.street ?? null,
    p_shipping_postal_code: address?.postalCode ?? null,
    p_shipping_city: address?.city ?? null,
    // Empty means Finland, and a column of empty strings is worse than a column
    // of nulls.
    p_shipping_country: address?.country || null,
  });

  if (error) {
    if (error.message.includes('unknown token')) {
      return 'unknown-token';
    }

    throw new Error(`Vastauksen tallennus epäonnistui: ${error.message}`);
  }

  return 'saved';
}
