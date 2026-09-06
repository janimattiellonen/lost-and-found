export type Course = {
  slug: string;
  name: string;
  clubId: number;
  clubName: string;
  /**
   * The value this course carries in the `course` column of `discs`, for the
   * clubs that record one. It is the short name the Google Sheet has always
   * used ("Oittaa"), not the long display name above, so a disc added by hand
   * lands under the same option in the list page's course filter as an
   * imported one. Absent for clubs that record no course per disc.
   */
  discCourseName?: string;
  /**
   * `discCourseName` in the genitive case ("Äijänpellon"), for a message that
   * names the course mid-sentence: "on löytynyt Äijänpellon radalta".
   *
   * Written out rather than derived, because Finnish genitive is not a suffix
   * rule: "Oittaa" gains an -n, but "Äijänpelto" also gradates its consonants
   * (lt -> ll). Absent wherever `discCourseName` is.
   */
  discCourseGenitive?: string;
};

export const courses: Course[] = [
  { slug: 'tali', name: 'Talin frisbeegolfpuisto', clubId: 2, clubName: 'Talin tallaajat ry' },
  {
    slug: 'oittaa',
    name: 'Oittaan frisbeegolfrata',
    clubId: 1,
    clubName: 'Puskasoturit ry',
    discCourseName: 'Oittaa',
    discCourseGenitive: 'Oittaan',
  },
  {
    slug: 'aijanpelto',
    name: 'Äijänpelto frisbeegolf',
    clubId: 1,
    clubName: 'Puskasoturit ry',
    discCourseName: 'Äijänpelto',
    discCourseGenitive: 'Äijänpellon',
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

/**
 * The course a disc is filed under, in the genitive case.
 *
 * What a message says mid-sentence: "on löytynyt Äijänpellon radalta". The
 * template supplies "radalta" itself, so this is the short course name inflected
 * and nothing more -- not the long display name.
 *
 * A name matching no configured course is returned as it is, in the nominative.
 * Imported Sheet data can hold any course an admin once typed; an uninflected
 * name reads slightly wrong, but losing the course entirely reads worse.
 *
 * Matched on the name alone, with no club scope, because the substitution runs
 * in the browser where the club id is not available. Safe only while one club
 * records a course per disc -- see specs/06-messaging-and-templates.md.
 */
export function getCourseGenitive(discCourseName: string | null | undefined): string {
  if (!discCourseName) {
    return '';
  }

  const course = courses.find((candidate) => candidate.discCourseName === discCourseName);

  return course?.discCourseGenitive ?? discCourseName;
}

/**
 * The course names a disc of this club may be filed under, in the order they
 * should be offered. Empty for a club that collects from a single course, which
 * is how the add form knows not to ask for one at all.
 */
export function getDiscCourseNames(clubId: number): string[] {
  const names = courses
    .filter((course) => course.clubId === clubId && course.discCourseName != null)
    .map((course) => course.discCourseName!);

  return names.length > 1 ? names : [];
}
