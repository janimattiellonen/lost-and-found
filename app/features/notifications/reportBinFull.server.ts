import { data } from 'react-router';

import { rateLimitHeaders, wasRecentlySubmitted } from '~/features/notifications/binFullRateLimit.server';
import { createBinFullNotification } from '~/models/binFullNotification.server';

/** Records a "bin is full" report unless one arrived within the rate-limit window. */
export async function reportBinFull(request: Request, course: { slug: string; name: string }) {
  if (!(await wasRecentlySubmitted(request, course.slug))) {
    await createBinFullNotification({ courseName: course.name });
  }

  return data({ success: true }, { headers: await rateLimitHeaders(course.slug) });
}
