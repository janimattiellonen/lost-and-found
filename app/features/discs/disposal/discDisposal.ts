import type { DisposalMethodValue } from './disposalMethod';

/** What is recorded when a disc is released for sale or donation. */
export type DiscDisposalDetails = {
  /** ISO date, y-MM-dd. */
  canBeSoldOrDonatedDate: string;
  /** Null when the method was left unanswered. */
  canBeSoldOrDonatedMethod: DisposalMethodValue | null;
};

/** The same, addressed to one disc — what the route receives. */
export type DiscDisposalInput = DiscDisposalDetails & { externalId: string };
