import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';

import NotifyForm from './components/NotifyForm';

import { createDiscFoundNotification } from '~/models/discFoundNotification.server';
import { getCourseBySlug } from '~/config/courses';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const course = getCourseBySlug(params.courseSlug!);

  if (!course) {
    throw new Response('Rataa ei löytynyt', { status: 404 });
  }

  return { course };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const course = getCourseBySlug(params.courseSlug!);

  if (!course) {
    throw new Response('Rataa ei löytynyt', { status: 404 });
  }

  const form = await request.formData();

  const contactName = form.get('contactName')?.toString() || null;
  const contactPhone = form.get('contactPhone')?.toString() || null;
  const contactEmail = form.get('contactEmail')?.toString() || null;
  const message = form.get('message')?.toString() || null;

  await createDiscFoundNotification({
    courseName: course.name,
    contactName,
    contactPhone,
    contactEmail,
    message,
  });

  return { success: true };
}

export default function NotifyCourseSlugPage(): JSX.Element {
  const { course } = useLoaderData<typeof loader>();

  return <NotifyForm course={course} />;
}
