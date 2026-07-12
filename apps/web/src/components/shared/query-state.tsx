'use client';

import type { ReactNode } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import type { LucideIcon } from 'lucide-react';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  loadingVariant?: 'page' | 'cards' | 'table' | 'form';
  children: ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  emptyTitle = 'No results',
  emptyDescription = 'There is nothing to show here yet.',
  emptyIcon,
  emptyAction,
  loadingVariant = 'page',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <LoadingState variant={loadingVariant} />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
