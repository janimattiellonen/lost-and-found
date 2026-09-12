import { describe, expect, it } from 'vitest';

import { toComposerDisc } from '~/features/messaging/composerData';
import { replaceTokensWithValues } from '~/features/messaging/messageContent';

import type { DiscDTO } from '~/types';

/**
 * A disc as the batch page reads one: Puskasoturit, the club that records a
 * course per disc, filed under a course `app/config/courses.ts` configures a
 * genitive for. Carries the owner's email too, which the composer has no use
 * for and should not be handed.
 */
const disc: DiscDTO = {
  id: 1,
  internalDiscId: null,
  externalId: '11111111-1111-1111-1111-111111111111',
  clubId: 1,
  discName: 'Destroyer',
  discColour: 'punainen',
  course: 'Äijänpelto',
  ownerName: 'Matti',
  ownerPhoneNumber: '+358401234567',
  ownerEmailAddress: 'matti@example.com',
  notifiedAt: '2026-09-01',
  ownerLinkToken: 'token',
};

describe('toComposerDisc', () => {
  it('keeps the course, so a batch message names it as a single one does', () => {
    expect(replaceTokensWithValues('Rata: [course]', toComposerDisc(disc))).toBe('Rata: Äijänpelto');
  });

  it('keeps enough of the course for the genitive to be looked up', () => {
    expect(replaceTokensWithValues('on löytynyt [courses] radalta', toComposerDisc(disc))).toBe(
      'on löytynyt Äijänpellon radalta',
    );
  });

  it('leaves behind the fields the composer has no use for', () => {
    expect(toComposerDisc(disc)).not.toHaveProperty('ownerEmailAddress');
  });
});
