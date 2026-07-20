'use client';

import { BellIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks/use-notifications';
import { cn, formatDate } from '@/lib/utils';

export function NotificationsList() {
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = query.data?.data ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {unread > 0 ? `${unread} unread` : 'All read'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={markAll.isPending || unread === 0}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isEmpty={!items.length}
        emptyIcon={BellIcon}
        emptyTitle="No notifications"
        emptyDescription="You're all caught up."
      >
        <div className="overflow-hidden rounded-lg border border-border/70">
          {items.map((n, index) => {
            const row = (
              <div
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 transition-colors',
                  index > 0 && 'border-t border-border/60',
                  !n.isRead && 'bg-primary/5',
                  n.link && 'hover:bg-muted/40',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    n.isRead ? 'bg-transparent' : 'bg-primary',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'truncate text-sm',
                        !n.isRead ? 'font-medium' : 'font-normal',
                      )}
                    >
                      {n.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px] font-normal capitalize"
                    >
                      {String(n.type).replaceAll('_', ' ').toLowerCase()}
                    </Badge>
                  </div>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatDate(n.createdAt, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!n.isRead ? (
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markRead.mutate(n.id);
                      }}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            );

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  className="block"
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                  }}
                >
                  {row}
                </Link>
              );
            }

            return <div key={n.id}>{row}</div>;
          })}
        </div>
      </QueryState>
    </div>
  );
}
