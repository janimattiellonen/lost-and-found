export type Course = {
  slug: string;
  name: string;
  clubId: number;
  clubName: string;
};

export const courses: Course[] = [
  { slug: 'tali', name: 'Talin frisbeegolfpuisto', clubId: 2, clubName: 'Talin tallaajat ry' },
  { slug: 'oittaa', name: 'Oittaan frisbeegolfrata', clubId: 1, clubName: 'Puskasoturit ry'  },
  { slug: 'aijanpelto', name: 'Äijänpelto frisbeegolf', clubId: 1, clubName: 'Puskasoturit ry'  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}
