import { HandoverMethod, type HandoverMethodValue } from '~/features/discs/handoverMethod';

/**
 * What the owner may choose, from where the disc is.
 *
 * Post and collecting from the admin always work. Collecting from the club's
 * storage is only on offer while the disc is actually in it — a disc already
 * fetched home is not there to be collected from, and a club whose discs never
 * go to a storage has no third option at all.
 *
 * Its own module rather than a second export from the query beside it: nothing
 * here touches the database, and the rule is worth testing without one.
 */
export function handoverMethodsFor(isInStorage: boolean): HandoverMethodValue[] {
  const methods: HandoverMethodValue[] = [HandoverMethod.ByMail, HandoverMethod.PickedUpFromHome];

  return isInStorage ? [...methods, HandoverMethod.PickedUpFromStorage] : methods;
}
