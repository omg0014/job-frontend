import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Button, PageHeader, EmptyState, ErrorState, Pagination, List } from '../../components/ui.jsx';
import { ListSkeleton } from '../../components/Loading.jsx';
import { formatDateTime } from '../../lib/format.js';
import { clsx } from '../../lib/clsx.js';

export const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const filters = { page, limit: 20 };
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => request(endpoints.notifications.list, filters),
    placeholderData: keepPreviousData,
  });

  const markRead = useMutation({
    mutationFn: (body) => request(endpoints.notifications.markRead, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markRead.mutate({ markAll: true })}
              disabled={markRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="We will let you know when your application status changes or an interview is scheduled."
        />
      ) : (
        <>
          <List>
            {notifications.map((notification) => {
              const unread = !notification.isRead;
              const body = (
                <div className="flex items-start gap-3">
                  {/* Unread is carried by the dot, the "New" label and the
                      weight together — never by colour alone. */}
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'mt-2 h-2 w-2 shrink-0 rounded-full',
                      unread ? 'bg-plum-600' : 'bg-transparent',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className={clsx('text-ui text-ink', unread ? 'font-semibold' : 'font-medium')}>
                        {notification.title}
                        {unread ? (
                          <span className="ml-2 inline-flex rounded-full bg-plum-50 px-2 py-px align-middle text-[11px] font-semibold text-plum-700">
                            New
                          </span>
                        ) : null}
                      </p>
                      <time className="text-meta text-ink-soft" dateTime={notification.createdAt}>
                        {formatDateTime(notification.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-ui leading-relaxed text-ink-soft">{notification.message}</p>
                  </div>
                </div>
              );

              const rowClass = clsx(
                'block px-4 py-4 sm:px-5',
                unread && 'bg-plum-50/40',
              );

              return (
                <li key={notification._id}>
                  {notification.link ? (
                    <Link
                      to={notification.link}
                      onClick={() => {
                        if (unread) {
                          markRead.mutate({ notificationId: notification._id });
                        }
                      }}
                      className={clsx(
                        rowClass,
                        'transition-colors duration-micro hover:bg-plum-50/70 focus-visible:bg-plum-50/70',
                      )}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={rowClass}>{body}</div>
                  )}
                </li>
              );
            })}
          </List>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};
