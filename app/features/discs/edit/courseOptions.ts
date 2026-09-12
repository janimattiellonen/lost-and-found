/**
 * The courses the edit form offers for one disc: the ones this club collects
 * from, plus whatever the disc is already filed under.
 *
 * The stored value is included even when it is not one of the club's courses,
 * and this is the whole point of the function. Sheet-imported rows hold any
 * course name an admin once typed, and a club may stop collecting from a course
 * without its old discs changing. A dropdown built from the club's list alone
 * would show such a disc as "no course" and quietly null the column on the next
 * save — losing, on a page whose job is to fix mistakes, the one fact nobody
 * asked to change.
 *
 * Allowing it back in adds no stray option to the disc list's course filter
 * either: the value is already in the table, so it is already in the filter.
 */
export function courseOptions(clubCourses: string[], storedCourse: string | null): string[] {
  if (storedCourse == null || clubCourses.includes(storedCourse)) {
    return clubCourses;
  }

  return [...clubCourses, storedCourse];
}
