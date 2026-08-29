import type { ReturnMethodValue } from './returnMethod';

/** What is recorded when a disc goes back to its owner. */
export type DiscReturnDetails = {
  /** ISO date, y-MM-dd. */
  returnedToOwnerDate: string;
  /** Null when the method was left unanswered. */
  returnMethod: ReturnMethodValue | null;
};

/** The same, addressed to one disc — what the route receives. */
export type DiscReturnInput = DiscReturnDetails & { externalId: string };
