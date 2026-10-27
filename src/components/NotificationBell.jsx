import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { formatRelative } from '../lib/format.js';
import { clsx } from '../lib/clsx.js';

/**
 * Two shapes for the same data: the default bell-and-popover for the candidate
 * header, and a `menu` variant that renders inline inside the staff drawer,
 * where the drawer itself is already the popover.
 */
export const NotificationBell = ({ variant = 'bell', onNavigate, onDark = false }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', { page: 1, limit: 8 }],
    queryFn: () => request(endpoints.notifications.list, { page: 1, limit: 8 }),
    // Polling keeps the badge roughly current without a websocket in V1.
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const markRead = useMutation({
    mutationFn: (body) => request(endpoints.notifications.markRead, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  if (variant === 'menu') {
    return (
      <section aria-label="Notifications">
        <div className="flex items-center justify-between px-3 py-1.5">
          <h2 className="flex items-center gap-2 text-ui font-semibold text-ink">
            <Bell className="h-4 w-4 text-ink-soft" aria-hidden="true" />
            Notifications
            {unreadCount > 0 ? (
              <span className="rounded-full bg-plum-600 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </h2>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markRead.mutate({ markAll: true })}
              className="text-meta font-semibold text-plum-600 hover:text-plum-800"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <p className="px-3 py-3 text-meta text-ink-soft">Nothing new right now.</p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {items.slice(0, 5).map((item) => (
              <li key={item._id}>
                <Link
                  to={item.link || '/notifications'}
                  onClick={() => {
                    if (!item.isRead) markRead.mutate({ notificationId: item._id });
                    onNavigate?.();
                  }}
                  className={clsx(
                    'block rounded-control px-3 py-2 transition-colors duration-micro hover:bg-plum-50',
                    !item.isRead && 'bg-plum-50/60',
                  )}
                >
                  <p className="text-ui font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-meta text-ink-soft">{item.message}</p>
                  <p className="mt-1 text-[11px] text-ink-soft">{formatRelative(item.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={clsx(
          'relative rounded-control p-2 transition-colors duration-micro',
          onDark
            ? 'text-white/80 hover:bg-white/10 hover:text-white'
            : 'text-ink-soft hover:bg-paper hover:text-ink',
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span
            className={clsx(
              'absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
              // On the plum bar the count takes gold, the one place it reads.
              onDark ? 'bg-gold-500 text-plum-900' : 'bg-plum-600 text-white',
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fade-in absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-line bg-field shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-ui font-semibold text-ink">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markRead.mutate({ markAll: true })}
                className="text-meta font-semibold text-plum-600 hover:text-plum-800"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-ui text-ink-soft">
              You have no notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-auto">
              {items.map((item) => (
                <li key={item._id}>
                  <Link
                    to={item.link || '/notifications'}
                    onClick={() => {
                      if (!item.isRead) markRead.mutate({ notificationId: item._id });
                      setOpen(false);
                    }}
                    className={clsx(
                      'block px-4 py-3 hover:bg-paper',
                      !item.isRead && 'bg-plum-50/40',
                    )}
                  >
                    <p className="text-ui font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-meta text-ink-soft">{item.message}</p>
                    <p className="mt-1 text-[11px] text-ink-soft/70">
                      {formatRelative(item.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-meta font-semibold text-plum-600 hover:bg-paper"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
};
