import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  step?: number;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Spaced, numbered block used to separate dense settings groups
 * (e.g. Profile → Payout, Organization → Treasury → Nox).
 */
export function SettingsSection({
  step,
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {step != null ? (
            <span
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground"
              aria-hidden
            >
              {step}
            </span>
          ) : null}
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
