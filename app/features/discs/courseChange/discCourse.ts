/** What is recorded when a disc is filed under a course. */
export type DiscCourseDetails = {
  /**
   * The course the disc was found on, or null to clear it. Null is a real
   * choice rather than "unanswered": it is how a disc filed under the wrong
   * course is put back to having none.
   */
  course: string | null;
};

/** The same, addressed to one disc — what the route receives. */
export type DiscCourseInput = DiscCourseDetails & { externalId: string };
