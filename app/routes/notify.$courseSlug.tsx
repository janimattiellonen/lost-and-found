import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import NotifyForm from '~/features/notifications/NotifyForm';
import { reportDiscFound } from '~/features/notifications/reportDiscFound.server';
import { getCourseBySlug } from '~/config/courses';

import type { JSX } from 'react';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return { course: requireCourse(params.courseSlug) };
};

export async function action({ request, params }: ActionFunctionArgs) {
  return reportDiscFound(await request.formData(), requireCourse(params.courseSlug).name);
}

export default function NotifyCourseSlugRoute(): JSX.Element {
  const { course } = useLoaderData<typeof loader>();

  return <NotifyForm course={course} />;
}

function requireCourse(slug: string | undefined) {
  const course = getCourseBySlug(slug!);

  if (!course) {
    throw new Response('Rataa ei löytynyt', { status: 404 });
  }

  return course;
}
