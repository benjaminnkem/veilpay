import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TONE_MAP: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  ACTIVE: 'default',
  COMPLETED: 'default',
  APPROVED: 'default',
  SUCCESS: 'default',
  ONBOARDING: 'secondary',
  ON_LEAVE: 'secondary',
  PENDING: 'secondary',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  INACTIVE: 'outline',
  PROCESSING: 'secondary',
  TERMINATED: 'destructive',
  REJECTED: 'destructive',
  FAILED: 'destructive',
  CANCELLED: 'destructive',
  EXPIRED: 'destructive',
  REVOKED: 'outline',
  ACCEPTED: 'default',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = status.toUpperCase().replaceAll(' ', '_');
  const variant = TONE_MAP[normalized] ?? 'outline';
  const label = status.replaceAll('_', ' ').toLowerCase();

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {label}
    </Badge>
  );
}
