'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { InputField, TextareaField } from '@/components/forms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';
import { getEmployees } from '@/features/employees/services/getEmployees';
import type { Employee } from '@/features/employees/types';
import { payrollRunsQueryKey } from '@/features/payroll/hooks/use-payroll-runs';
import {
  createPayrollSchema,
  type CreatePayrollFormValues,
} from '@/features/payroll/schemas/createPayroll.schema';
import { createPayroll } from '@/features/payroll/services/getPayrollRuns';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

const STEPS = [
  'Period',
  'Employees',
  'Review',
  'Preview',
  'Submit',
] as const;

function defaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const pay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    name: `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()} payroll`,
    periodStart: iso(start),
    periodEnd: iso(end),
    payDate: iso(pay),
    notes: '',
  };
}

export function CreatePayrollDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const qc = useQueryClient();
  const router = useRouter();

  const form = useForm<CreatePayrollFormValues>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: defaultPeriod(),
  });

  const employeesQuery = useQuery({
    queryKey: ['employees', 'payroll-wizard', { status: 'ACTIVE' }],
    queryFn: async () => {
      const pageSize = 100;
      const first = await getEmployees({
        page: 1,
        pageSize,
        status: 'ACTIVE',
      });
      const all = [...first.data];
      const totalPages = first.meta.totalPages ?? 1;
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await getEmployees({
          page,
          pageSize,
          status: 'ACTIVE',
        });
        all.push(...next.data);
      }
      return all;
    },
    enabled: open,
  });

  const activeEmployees = employeesQuery.data ?? [];

  const selectedEmployees = useMemo(() => {
    if (selectAll) return activeEmployees;
    return activeEmployees.filter((e) => selectedIds.includes(e.id));
  }, [activeEmployees, selectAll, selectedIds]);

  const mutation = useApiMutation({
    mutationFn: createPayroll,
    onSuccess: async (payroll) => {
      notify.success(
        'Payroll draft created',
        'Review totals, then submit for HR → Finance → CEO approval.'
      );
      await qc.invalidateQueries({ queryKey: payrollRunsQueryKey });
      setOpen(false);
      setStep(0);
      router.push(`${ROUTES.payroll}/${payroll.id}`);
    },
    onError: (error) => notify.error(error),
  });

  const resetWizard = () => {
    form.reset(defaultPeriod());
    setStep(0);
    setSelectAll(true);
    setSelectedIds([]);
  };

  const canNext = async () => {
    if (step === 0) {
      return form.trigger(['name', 'periodStart', 'periodEnd', 'payDate']);
    }
    if (step === 1) {
      if (!selectAll && selectedIds.length === 0) {
        notify.error('Select at least one employee');
        return false;
      }
      return true;
    }
    return true;
  };

  const onCreate = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      name: values.name,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
      payDate: values.payDate,
      notes: values.notes,
      employeeIds: selectAll ? undefined : selectedIds,
    });
  });

  const toggleEmployee = (id: string, checked: boolean) => {
    setSelectAll(false);
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetWizard();
        if (next) resetWizard();
      }}
    >
      <DialogTrigger render={<Button type="button" />}>
        New payroll run
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create payroll</DialogTitle>
          <DialogDescription>
            Multi-step builder: period → employees → review → draft. Execution
            stays off-chain until Safe + Nox is connected.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium',
                index === step
                  ? 'bg-primary text-primary-foreground'
                  : index < step
                    ? 'bg-primary/15 text-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        <div className="min-h-[280px] space-y-4">
          {step === 0 ? (
            <div className="space-y-4">
              <InputField control={form.control} name="name" label="Run name" />
              <div className="grid gap-4 sm:grid-cols-3">
                <InputField
                  control={form.control}
                  name="periodStart"
                  label="Period start"
                  type="date"
                />
                <InputField
                  control={form.control}
                  name="periodEnd"
                  label="Period end"
                  type="date"
                />
                <InputField
                  control={form.control}
                  name="payDate"
                  label="Pay date"
                  type="date"
                />
              </div>
              <TextareaField
                control={form.control}
                name="notes"
                label="Notes"
                placeholder="Optional notes for approvers"
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={(v) => {
                    setSelectAll(Boolean(v));
                    if (v) setSelectedIds([]);
                  }}
                />
                Include all active employees ({activeEmployees.length})
              </label>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border/70 p-2">
                {employeesQuery.isLoading ? (
                  <p className="p-2 text-sm text-muted-foreground">Loading…</p>
                ) : activeEmployees.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    No active employees found.
                  </p>
                ) : (
                  activeEmployees.map((employee) => (
                    <EmployeeRow
                      key={employee.id}
                      employee={employee}
                      checked={
                        selectAll || selectedIds.includes(employee.id)
                      }
                      disabled={selectAll}
                      onCheckedChange={(checked) =>
                        toggleEmployee(employee.id, checked)
                      }
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Compensation is snapshotted when the draft is created. Current
                salary, bonus, allowance, and deduction records are applied
                automatically.
              </p>
              <div className="rounded-lg border border-border/70 p-3">
                <div className="font-medium">
                  {selectedEmployees.length} employee
                  {selectedEmployees.length === 1 ? '' : 's'} selected
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedEmployees.slice(0, 12).map((e) => (
                    <Badge key={e.id} variant="secondary">
                      {e.firstName} {e.lastName}
                    </Badge>
                  ))}
                  {selectedEmployees.length > 12 ? (
                    <Badge variant="outline">
                      +{selectedEmployees.length - 12} more
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <PreviewField label="Name" value={form.watch('name')} />
                <PreviewField
                  label="Period"
                  value={`${form.watch('periodStart')} → ${form.watch('periodEnd')}`}
                />
                <PreviewField label="Pay date" value={form.watch('payDate')} />
                <PreviewField
                  label="Employees"
                  value={String(selectedEmployees.length)}
                />
              </div>
              <p className="text-muted-foreground">
                Creating a draft runs the payroll engine and generates line
                items. You can regenerate before submission.
              </p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                <p className="font-medium">Ready to create draft</p>
                <p className="mt-1 text-muted-foreground">
                  After creation you can review totals, submit for approval, and
                  eventually execute. Blockchain settlement stays pending until
                  Safe + Nox integration.
                </p>
              </div>
              {form.watch('notes') ? (
                <PreviewField label="Notes" value={form.watch('notes') ?? ''} />
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 0) setOpen(false);
              else setStep((s) => s - 1);
            }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={async () => {
                  if (await canNext()) setStep((s) => s + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void onCreate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Creating…' : 'Create draft'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeRow({
  employee,
  checked,
  disabled,
  onCheckedChange,
}: {
  employee: Employee;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {employee.firstName} {employee.lastName}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {employee.department ?? '-'} · {employee.position ?? employee.title ?? '-'}
        </div>
      </div>
    </label>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || '-'}</div>
    </div>
  );
}
