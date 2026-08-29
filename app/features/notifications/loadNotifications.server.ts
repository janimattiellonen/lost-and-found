import { getBinFullNotifications } from '~/models/binFullNotification.server';
import { getDiscFoundNotifications } from '~/models/discFoundNotification.server';

/** Everything the notifications page shows, fetched in one round trip. */
export async function loadNotifications(request: Request) {
  const [notifications, binFullNotifications] = await Promise.all([
    getDiscFoundNotifications(request),
    getBinFullNotifications(request),
  ]);

  return { notifications, binFullNotifications };
}
