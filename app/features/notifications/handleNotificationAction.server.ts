import {
  deleteAllBinFullNotifications,
  deleteBinFullNotification,
  markBinFullNotificationAsRead,
} from '~/models/binFullNotification.server';
import {
  deleteAllNotifications,
  deleteNotification,
  markNotificationAsRead,
} from '~/models/discFoundNotification.server';

/** Applies one notification-list intent posted from the page. */
export async function handleNotificationAction(request: Request, body: FormData) {
  const intent = body.get('intent');
  const notificationId = body.get('notificationId');

  if (intent === 'deleteAll') {
    await deleteAllNotifications(request);
    return {};
  }

  if (intent === 'deleteAllBinFull') {
    await deleteAllBinFullNotifications(request);
    return {};
  }

  if (!notificationId) {
    return {};
  }

  const id = parseInt(notificationId.toString(), 10);

  if (intent === 'delete') {
    await deleteNotification(id, request);
  } else if (intent === 'markAsRead') {
    await markNotificationAsRead(id, request);
  } else if (intent === 'deleteBinFull') {
    await deleteBinFullNotification(id, request);
  } else if (intent === 'markBinFullAsRead') {
    await markBinFullNotificationAsRead(id, request);
  }

  return {};
}
