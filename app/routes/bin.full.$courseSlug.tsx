import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { createCookie, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import BinFullForm from './components/BinFullForm';

import { createBinFullNotification } from '~/models/binFullNotification.server';
import { getCourseBySlug } from '~/config/courses';

const RATE_LIMIT_MS = 10 * 60 * 1000;

const cookieFor = (slug: string) =>
  createCookie(`bin_full_rl_${slug}`, {
    path: '/bin/full',
    sameSite: 'lax',
    maxAge: RATE_LIMIT_MS / 1000,
    httpOnly: true,
  });

async function readRateLimitedAt(request: Request, slug: string): Promise<number | null> {
  const cookie = cookieFor(slug);
  const value = await cookie.parse(request.headers.get('Cookie'));
  const ts = typeof value === 'number' ? value : null;
  if (!ts) return null;
  return Date.now() - ts < RATE_LIMIT_MS ? ts : null;
}

export const loader = async ({ request, params }: LoaderArgs) => {
  const course = getCourseBySlug(params.courseSlug!);

  if (!course) {
    throw new Response('Rataa ei löytynyt', { status: 404 });
  }

  const recentlySubmitted = (await readRateLimitedAt(request, course.slug)) != null;

  return json({ course, recentlySubmitted });
};

export async function action({ request, params }: ActionArgs) {
  const course = getCourseBySlug(params.courseSlug!);

  if (!course) {
    throw new Response('Rataa ei löytynyt', { status: 404 });
  }

  const recentlySubmitted = (await readRateLimitedAt(request, course.slug)) != null;

  if (!recentlySubmitted) {
    await createBinFullNotification({ courseName: course.name });
  }

  const cookie = cookieFor(course.slug);
  const headers = new Headers();
  headers.append('Set-Cookie', await cookie.serialize(Date.now()));

  return json({ success: true }, { headers });
}

export default function BinFullCourseSlugPage(): JSX.Element {
  const { course, recentlySubmitted } = useLoaderData<typeof loader>();

  return <BinFullForm course={course} alreadySubmitted={recentlySubmitted} />;
}
