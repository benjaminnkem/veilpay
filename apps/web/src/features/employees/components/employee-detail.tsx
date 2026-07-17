'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, UserIcon } from 'lucide-react';
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
import { ROUTES } from '@/constants/routes';
import { EditCompensationDialog } from '@/features/employees/components/edit-compensation-dialog';
import { getEmployee } from '@/features/employees/services/getEmployees';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface CompensationRow {
  id: string;
  type: string;
  amountCents: number;
  currency: string;
  frequency: string;
  effectiveDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

const COMPENSATION_WRITE_ROLES = new Set([
  'OWNER',
  'HR',
  'SUPER_ADMIN',
]);

export function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const { user } = useCurrentUser();
  const canEditCompensation = COMPENSATION_WRITE_ROLES.has(
    String(user?.role ?? '')
  );

  const employeeQuery = useQuery({
    queryKey: ['employees', employeeId],
    queryFn: () => getEmployee(employeeId),
  });

  const compensationQuery = useQuery({
    queryKey: ['compensation', employeeId],
    queryFn: () =>
      authGet<CompensationRow[]>(`/compensation/employee/${employeeId}`),
  });

  const employee = employeeQuery.data;
  const currentSalary = compensationQuery.data?.find(
    (c) => c.isCurrent && c.type === 'SALARY'
  );
  const currentLines =
    compensationQuery.data?.filter((c) => c.isCurrent) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.employees} />}
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
      </div>

      <QueryState
        isLoading={employeeQuery.isLoading}
        isError={employeeQuery.isError}
        error={employeeQuery.error}
        onRetry={() => employeeQuery.refetch()}
        isEmpty={!employee}
        emptyIcon={UserIcon}
        emptyTitle="Employee not found"
        emptyDescription="This employee may have been removed."
      >
        {employee ? (
          <>
            <Card className="border-border/60">
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-xl">
                    {employee.firstName} {employee.lastName}
                  </CardTitle>
                  <CardDescription>{employee.email}</CardDescription>
                </div>
                <Badge className="capitalize">
                  {String(employee.status).replaceAll('_', ' ').toLowerCase()}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <Field label="Department" value={employee.department} />
                <Field
                  label="Position"
                  value={employee.position ?? employee.title}
                />
                <Field
                  label="Hire date"
                  value={
                    employee.hireDate ? formatDate(employee.hireDate) : null
                  }
                />
                <Field label="Phone" value={employee.phone} />
                <Field label="Country" value={employee.country} />
                <Field
                  label="Wallet"
                  value={employee.walletAddress}
                  mono
                />
                <Field label="Employee #" value={employee.employeeNumber} />
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Compensation</CardTitle>
                  <CardDescription>
                    HR sets pay. History is immutable — raises create a new
                    record; payroll reads the current line.
                  </CardDescription>
                </div>
                {canEditCompensation ? (
                  <EditCompensationDialog
                    employeeId={employeeId}
                    triggerLabel={
                      currentSalary || currentLines.length
                        ? 'Edit compensation'
                        : 'Add compensation'
                    }
                    defaults={
                      currentSalary
                        ? {
                            type: currentSalary.type,
                            amount: currentSalary.amountCents / 100,
                            currency: currentSalary.currency,
                            frequency: currentSalary.frequency,
                          }
                        : undefined
                    }
                  />
                ) : null}
              </CardHeader>
              <CardContent className="space-y-6">
                {compensationQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : !compensationQuery.data?.length ? (
                  <p className="text-sm text-muted-foreground">
                    No compensation records yet.
                    {canEditCompensation
                      ? ' Add starting pay with Edit compensation.'
                      : ''}
                  </p>
                ) : (
                  <>
                    {currentLines.length > 0 ? (
                      <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                        <p className="mb-3 text-sm font-medium">Current</p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                          {currentLines.map((c) => (
                            <div key={c.id}>
                              <div className="text-muted-foreground">
                                {formatTypeLabel(c.type)}
                              </div>
                              <div className="font-medium">
                                {formatMoney(c.amountCents, c.currency)}
                              </div>
                              <div className="text-muted-foreground">
                                {formatFrequency(c.frequency)} · from{' '}
                                {c.effectiveDate}
                              </div>
                              {c.description ? (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {c.description}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-sm font-medium">History</p>
                      <div className="divide-y divide-border">
                        {compensationQuery.data.map((c) => (
                          <div
                            key={c.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">
                                {c.type} ·{' '}
                                {formatMoney(c.amountCents, c.currency)}
                              </div>
                              <div className="text-muted-foreground">
                                {c.frequency} · effective {c.effectiveDate}
                                {c.endDate ? ` → ${c.endDate}` : ''}
                              </div>
                              {c.description ? (
                                <div className="text-xs text-muted-foreground">
                                  {c.description}
                                </div>
                              ) : null}
                            </div>
                            {c.isCurrent ? (
                              <Badge variant="secondary">Current</Badge>
                            ) : (
                              <Badge variant="outline">Historical</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}

function formatMoney(amountCents: number, currency: string) {
  try {
    return (amountCents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    });
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency || 'USD'}`;
  }
}

function formatTypeLabel(type: string) {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatFrequency(frequency: string) {
  return frequency
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={mono ? 'font-mono text-xs break-all' : 'font-medium'}>
        {value || '—'}
      </div>
    </div>
  );
}
