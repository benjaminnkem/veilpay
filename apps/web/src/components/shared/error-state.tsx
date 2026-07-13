import { AlertTriangleIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  error,
  title = 'Unable to load data',
  message,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  const description = message ?? getErrorMessage(error);

  return (
    <Alert
      variant="destructive"
      className={cn('border-destructive/30 bg-destructive/5', className)}
    >
      <AlertTriangleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{description}</span>
        {(onRetry || action) && (
          <div className="flex flex-wrap gap-2">
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                Try again
              </Button>
            ) : null}
            {action}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
