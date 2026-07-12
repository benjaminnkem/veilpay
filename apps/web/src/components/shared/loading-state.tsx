import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  rows?: number;
  className?: string;
  variant?: 'page' | 'cards' | 'table' | 'form';
}

export function LoadingState({
  rows = 4,
  className,
  variant = 'page',
}: LoadingStateProps) {
  if (variant === 'cards') {
    return (
      <div
        className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}
        aria-busy="true"
        aria-label="Loading"
      >
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        className={cn('space-y-3', className)}
        aria-busy="true"
        aria-label="Loading table"
      >
        <Skeleton className="h-9 w-full max-w-xs" />
        <div className="space-y-2 rounded-none border border-border/60 p-3">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div
        className={cn('space-y-4', className)}
        aria-busy="true"
        aria-label="Loading form"
      >
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="h-8 w-28" />
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <LoadingState variant="cards" rows={4} />
      <LoadingState variant="table" rows={6} />
    </div>
  );
}
