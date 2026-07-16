'use client';

import { BellIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={markAll.isPending || items.every((n) => n.isRead)}
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
                  ? 'border-border/60 opacity-80'
                  : 'border-border/60 border-l-2 border-l-primary'
              }
            >
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">{n.title}</CardTitle>
                  <CardDescription>
                    {formatDate(n.createdAt)} · {n.type}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!n.isRead ? (
                    <Badge variant="secondary">Unread</Badge>
                  ) : null}
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
