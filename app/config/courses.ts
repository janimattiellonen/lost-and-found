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
};

export const courses: Course[] = [
  { slug: 'tali', name: 'Talin frisbeegolfpuisto', clubId: 2, clubName: 'Talin tallaajat ry' },
  { slug: 'oittaa', name: 'Oittaan frisbeegolfrata', clubId: 1, clubName: 'Puskasoturit ry', discCourseName: 'Oittaa' },
  {
    slug: 'aijanpelto',
    name: 'Äijänpelto frisbeegolf',
    clubId: 1,
    clubName: 'Puskasoturit ry',
    discCourseName: 'Äijänpelto',
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
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
