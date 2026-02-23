import { ActionArgs, json, LoaderArgs, redirect } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';

import styled from '@emotion/styled';
import { Button } from '@mui/material';

import { isUserLoggedIn } from '~/models/utils';
import { getDiscFoundNotifications, markNotificationAsRead, deleteNotification } from '~/models/discFoundNotification.server';
import { DiscFoundNotificationDTO } from '~/types';
import { formatDateTime } from '~/routes/utils';

import H2 from '~/routes/components/H2';
import QrPosterButtons from '~/routes/components/admin/QrPosterButtons';

const Card = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  max-width: 40rem;
`;

const UnreadCard = styled(Card)`
  border-left: 4px solid #1976d2;
  background-color: #f5f9ff;
`;

export const loader = async ({ request }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const notifications = await getDiscFoundNotifications(request);

  return json({ notifications });
};

export async function action({ request }: ActionArgs) {
  const body = await request.formData();
  const intent = body.get('intent');
  const notificationId = body.get('notificationId');

  if (!notificationId) {
    return json({});
  }

  const id = parseInt(notificationId.toString(), 10);

  if (intent === 'delete') {
    await deleteNotification(id, request);
  } else if (intent === 'markAsRead') {
    await markNotificationAsRead(id, request);
  }

  return json({});
}

function NotificationItem({ notification }: { notification: DiscFoundNotificationDTO }) {
  const fetcher = useFetcher();
  const isUnread = !notification.readAt;
  const CardComponent = isUnread ? UnreadCard : Card;

  const hasContactInfo = notification.contactName || notification.contactPhone || notification.contactEmail;

  return (
    <CardComponent>
      <div className="text-sm text-gray-500 mb-2">
        {formatDateTime(notification.createdAt)}
        {notification.courseName && (
          <span className="ml-4">{notification.courseName}</span>
        )}
        {notification.readAt && (
          <span className="ml-4">Luettu: {formatDateTime(notification.readAt)}</span>
        )}
      </div>

      {hasContactInfo && (
        <div className="mb-2">
          {notification.contactName && <div><strong>Nimi:</strong> {notification.contactName}</div>}
          {notification.contactPhone && <div><strong>Puhelin:</strong> {notification.contactPhone}</div>}
          {notification.contactEmail && <div><strong>Sähköposti:</strong> {notification.contactEmail}</div>}
        </div>
      )}

      {notification.message && (
        <div className="mb-2">
          <strong>Viesti:</strong> {notification.message}
        </div>
      )}

      {!hasContactInfo && !notification.message && (
        <div className="text-gray-500 italic mb-2">Ei lisätietoja</div>
      )}

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
    </CardComponent>
  );
}

export default function NotificationsPage(): JSX.Element {
  const { notifications } = useLoaderData<typeof loader>();

  return (
    <div>
      <H2 className="mt-8 mb-4">Ilmoitukset löydetyistä kiekoista</H2>

      <QrPosterButtons />

      {notifications.length === 0 && (
        <p className="text-gray-500">Ei ilmoituksia.</p>
      )}

      {notifications.map((notification: DiscFoundNotificationDTO) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
