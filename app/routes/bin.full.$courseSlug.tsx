import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { wasRecentlySubmitted } from '~/features/notifications/binFullRateLimit.server';
import BinFullForm from '~/features/notifications/BinFullForm';
import { reportBinFull } from '~/features/notifications/reportBinFull.server';
import { getCourseBySlug } from '~/config/courses';

import type { JSX } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const course = requireCourse(params.courseSlug);

  return { course, recentlySubmitted: await wasRecentlySubmitted(request, course.slug) };
};

export async function action({ request, params }: ActionFunctionArgs) {
  return reportBinFull(request, requireCourse(params.courseSlug));
}

export default function BinFullCourseSlugRoute(): JSX.Element {
  const { course, recentlySubmitted } = useLoaderData<typeof loader>();

  return <BinFullForm course={course} alreadySubmitted={recentlySubmitted} />;
}

function requireCourse(slug: string | undefined) {
  const course = getCourseBySlug(slug!);

  if (!course) {
    throw new Response('Rataa ei löytynyt', { status: 404 });
  }

  return course;
}
