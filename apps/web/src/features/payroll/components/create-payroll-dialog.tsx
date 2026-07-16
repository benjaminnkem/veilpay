'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { InputField, TextareaField } from '@/components/forms';
import { Button } from '@/components/ui/button';
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
import { payrollRunsQueryKey } from '@/features/payroll/hooks/use-payroll-runs';
import {
  createPayrollSchema,
  type CreatePayrollFormValues,
} from '@/features/payroll/schemas/createPayroll.schema';
import { createPayroll } from '@/features/payroll/services/getPayrollRuns';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

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
  const qc = useQueryClient();
  const router = useRouter();

  const form = useForm<CreatePayrollFormValues>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: defaultPeriod(),
  });

  const mutation = useApiMutation({
    mutationFn: createPayroll,
    onSuccess: async (payroll) => {
      notify.success('Payroll created', 'Items generated from compensation.');
      await qc.invalidateQueries({ queryKey: payrollRunsQueryKey });
      setOpen(false);
      router.push(`${ROUTES.payroll}/${payroll.id}`);
    },
    onError: (error) => notify.error(error),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      name: values.name,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
      payDate: values.payDate,
      notes: values.notes,
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        New payroll run
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create payroll</DialogTitle>
          <DialogDescription>
            Generates draft line items from current employee compensation.
            Payment execution uses the PaymentProvider abstraction (mock until
            blockchain).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <InputField control={form.control} name="name" label="Name" />
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
            placeholder="Optional notes"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
