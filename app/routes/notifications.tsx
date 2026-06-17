import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';

import * as stylex from '@stylexjs/stylex';

import { color, radius, space } from '~/styles/tokens.stylex';
import Button from '~/routes/components/Button';

import { isUserLoggedIn } from '~/models/utils';
import {
  getDiscFoundNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '~/models/discFoundNotification.server';
import {
  getBinFullNotifications,
  markBinFullNotificationAsRead,
  deleteBinFullNotification,
  deleteAllBinFullNotifications,
} from '~/models/binFullNotification.server';
import type { BinFullNotificationDTO, DiscFoundNotificationDTO } from '~/types';
import { formatDateTime } from '~/routes/utils';

import H2 from '~/routes/components/H2';
import QrPosterButtons from '~/routes/components/admin/QrPosterButtons';
import BinFullQrPosterButtons from '~/routes/components/admin/BinFullQrPosterButtons';

import type { JSX } from "react";

const styles = stylex.create({
  card: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
    maxWidth: '40rem',
  },
  unread: {
    borderLeftWidth: '4px',
    borderLeftColor: color.accent,
    backgroundColor: '#f5f9ff',
  },
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const [notifications, binFullNotifications] = await Promise.all([
    getDiscFoundNotifications(request),
    getBinFullNotifications(request),
  ]);

  return { notifications, binFullNotifications };
};

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
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

function NotificationItem({ notification }: { notification: DiscFoundNotificationDTO }) {
  const fetcher = useFetcher();
  const isUnread = !notification.readAt;

  const hasContactInfo = notification.contactName || notification.contactPhone || notification.contactEmail;

  return (
    <div {...stylex.props(styles.card, isUnread && styles.unread)}>
      <div className="text-sm text-gray-500 mb-2">
        {formatDateTime(notification.createdAt)}
        {notification.courseName && <span className="ml-4">{notification.courseName}</span>}
        {notification.readAt && <span className="ml-4">Luettu: {formatDateTime(notification.readAt)}</span>}
      </div>

      {hasContactInfo && (
        <div className="mb-2">
          {notification.contactName && (
            <div>
              <strong>Nimi:</strong> {notification.contactName}
            </div>
          )}
          {notification.contactPhone && (
            <div>
              <strong>Puhelin:</strong> {notification.contactPhone}
            </div>
          )}
          {notification.contactEmail && (
            <div>
              <strong>Sähköposti:</strong> {notification.contactEmail}
            </div>
          )}
        </div>
      )}

      {notification.message && (
        <div className="mb-2">
          <strong>Viesti:</strong> {notification.message}
        </div>
      )}

      {!hasContactInfo && !notification.message && <div className="text-gray-500 italic mb-2">Ei lisätietoja</div>}

      <div className="flex gap-2 mt-2">
        {isUnread && (
          <fetcher.Form method="post">
            <input type="hidden" name="notificationId" value={notification.id} />
            <input type="hidden" name="intent" value="markAsRead" />
            <Button variant="outlined" size="small" type="submit">
              Merkitse luetuksi
            </Button>
          </fetcher.Form>
        )}

        <fetcher.Form
          method="post"
          onSubmit={(e) => {
            if (!confirm('Haluatko varmasti poistaa ilmoituksen?')) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="notificationId" value={notification.id} />
          <input type="hidden" name="intent" value="delete" />
          <Button variant="outlined" size="small" color="error" type="submit">
            Poista
          </Button>
        </fetcher.Form>
      </div>
    </div>
  );
}

function BinFullNotificationItem({ notification }: { notification: BinFullNotificationDTO }) {
  const fetcher = useFetcher();
  const isUnread = !notification.readAt;

  return (
    <div {...stylex.props(styles.card, isUnread && styles.unread)}>
      <div className="text-sm text-gray-500 mb-2">
        {formatDateTime(notification.createdAt)}
        <span className="ml-4">{notification.courseName}</span>
        {notification.readAt && <span className="ml-4">Luettu: {formatDateTime(notification.readAt)}</span>}
      </div>

      <div className="flex gap-2 mt-2">
        {isUnread && (
          <fetcher.Form method="post">
            <input type="hidden" name="notificationId" value={notification.id} />
            <input type="hidden" name="intent" value="markBinFullAsRead" />
            <Button variant="outlined" size="small" type="submit">
              Merkitse luetuksi
            </Button>
          </fetcher.Form>
        )}

        <fetcher.Form
          method="post"
          onSubmit={(e) => {
            if (!confirm('Haluatko varmasti poistaa ilmoituksen?')) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="notificationId" value={notification.id} />
          <input type="hidden" name="intent" value="deleteBinFull" />
          <Button variant="outlined" size="small" color="error" type="submit">
            Poista
          </Button>
        </fetcher.Form>
      </div>
    </div>
  );
}

export default function NotificationsPage(): JSX.Element {
  const { notifications, binFullNotifications } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div>
      <H2 className="mt-8 mb-4">Ilmoitukset löydetyistä kiekoista</H2>

      <QrPosterButtons />

      {notifications.length > 0 && (
        <div className="mb-4">
          <fetcher.Form
            method="post"
            onSubmit={(e) => {
              if (!confirm('Haluatko varmasti poistaa kaikki ilmoitukset?')) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="deleteAll" />
            <Button variant="outlined" size="small" color="error" type="submit">
              Poista kaikki
            </Button>
          </fetcher.Form>
        </div>
      )}

      {notifications.length === 0 && <p className="text-gray-500">Ei ilmoituksia.</p>}

      {notifications.map((notification: DiscFoundNotificationDTO) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}

      <H2 className="mt-12 mb-4">Ilmoitukset täysistä löytökiekkolaatikoista</H2>

      <BinFullQrPosterButtons />

      {binFullNotifications.length > 0 && (
        <div className="mb-4">
          <fetcher.Form
            method="post"
            onSubmit={(e) => {
              if (!confirm('Haluatko varmasti poistaa kaikki ilmoitukset?')) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="deleteAllBinFull" />
            <Button variant="outlined" size="small" color="error" type="submit">
              Poista kaikki
            </Button>
          </fetcher.Form>
        </div>
      )}

      {binFullNotifications.length === 0 && <p className="text-gray-500">Ei ilmoituksia.</p>}

      {binFullNotifications.map((notification: BinFullNotificationDTO) => (
        <BinFullNotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
