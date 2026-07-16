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
import { getEmployee } from '@/features/employees/services/getEmployees';
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

export function EmployeeDetail({ employeeId }: { employeeId: string }) {
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
              <CardHeader>
                <CardTitle className="text-base">Compensation history</CardTitle>
                <CardDescription>
                  Historical records are retained; current lines are marked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {compensationQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : !compensationQuery.data?.length ? (
                  <p className="text-sm text-muted-foreground">
                    No compensation records yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {compensationQuery.data.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">
                            {c.type} · {(c.amountCents / 100).toLocaleString(
                              undefined,
                              {
                                style: 'currency',
                                currency: c.currency || 'USD',
                              }
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {c.frequency} · effective {c.effectiveDate}
                            {c.endDate ? ` → ${c.endDate}` : ''}
                          </div>
                        </div>
                        {c.isCurrent ? (
                          <Badge variant="secondary">Current</Badge>
                        ) : (
                          <Badge variant="outline">Historical</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </QueryState>
    </div>
  );
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
