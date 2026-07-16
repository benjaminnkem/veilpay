'use client';

import { BellIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks/use-notifications';
import { formatDate } from '@/lib/utils';

export function NotificationsList() {
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = query.data?.data ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} unread` : 'All caught up'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
        emptyDescription="You’re all caught up."
        loadingVariant="cards"
      >
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={
                n.isRead
                  ? 'border-border/70 shadow-sm'
                  : 'border-border/70 border-l-2 border-l-primary shadow-sm'
              }
            >
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">{n.title}</CardTitle>
                  <CardDescription>
                    {formatDate(n.createdAt, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={n.type} />
                  {!n.isRead ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{n.body}</p>
                {n.link ? (
                  <Link
                    href={n.link}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    View details
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
