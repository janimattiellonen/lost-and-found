export type Course = {
  slug: string;
  name: string;
};

export const courses: Course[] = [
  { slug: 'tali', name: 'Talin frisbeegolfpuisto' },
  { slug: 'oittaa', name: 'Oittaan frisbeegolfrata' },
  { slug: 'aijanpelto', name: 'Äijänpelto frisbeegolf' },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}
