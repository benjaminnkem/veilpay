'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  DatePickerField,
  SelectField,
  TextareaField,
} from '@/components/forms';
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
import {
  COMPENSATION_CURRENCY_OPTIONS,
  COMPENSATION_FREQUENCY_OPTIONS,
  COMPENSATION_TYPE_OPTIONS,
  createCompensationSchema,
  type CreateCompensationFormValues,
} from '@/features/employees/schemas/createCompensation.schema';
import { createCompensation } from '@/features/employees/services/createCompensation';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

interface EditCompensationDialogProps {
  employeeId: string;
  defaults?: {
    type?: string;
    amount?: number;
    currency?: string;
    frequency?: string;
  };
  triggerLabel?: string;
}

export function EditCompensationDialog({
  employeeId,
  defaults,
  triggerLabel = 'Edit compensation',
}: EditCompensationDialogProps) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const form = useForm<CreateCompensationFormValues>({
    resolver: zodResolver(createCompensationSchema),
    defaultValues: {
      type: (defaults?.type as CreateCompensationFormValues['type']) ?? 'SALARY',
      amount: defaults?.amount,
      currency: defaults?.currency ?? 'USD',
      frequency:
        (defaults?.frequency as CreateCompensationFormValues['frequency']) ??
        'MONTHLY',
      effectiveDate: new Date(),
      description: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: createCompensation,
    onSuccess: async () => {
      notify.success(
        'Compensation updated',
        'A new record was created. Previous pay terms remain in history.'
      );
      await qc.invalidateQueries({ queryKey: ['compensation', employeeId] });
      form.reset({
        type: 'SALARY',
        amount: undefined,
        currency: 'USD',
        frequency: 'MONTHLY',
        effectiveDate: new Date(),
        description: '',
      });
      setOpen(false);
    },
    onError: (error) => notify.error(error),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      employeeId,
      type: values.type,
      amount: values.amount,
      currency: values.currency,
      frequency: values.frequency,
      effectiveDate: values.effectiveDate.toISOString().slice(0, 10),
      description: values.description?.trim() || undefined,
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          form.reset({
            type:
              (defaults?.type as CreateCompensationFormValues['type']) ??
              'SALARY',
            amount: defaults?.amount,
            currency: defaults?.currency ?? 'USD',
            frequency:
              (defaults?.frequency as CreateCompensationFormValues['frequency']) ??
              'MONTHLY',
            effectiveDate: new Date(),
            description: '',
          });
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {defaults?.amount != null
              ? 'New compensation'
              : 'Add compensation'}
          </DialogTitle>
          <DialogDescription>
            This creates a new compensation record. Past amounts are never
            overwritten - the previous current line is ended automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <SelectField
            control={form.control}
            name="type"
            label="Type"
            options={[...COMPENSATION_TYPE_OPTIONS]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                New amount
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="5500"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={
                  form.watch('amount') === undefined ? '' : form.watch('amount')
                }
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue(
                    'amount',
                    value === '' ? (undefined as unknown as number) : Number(value),
                    { shouldValidate: true }
                  );
                }}
              />
              {form.formState.errors.amount ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Major units (e.g. 5500 for $5,500)
                </p>
              )}
            </div>
            <SelectField
              control={form.control}
              name="currency"
              label="Currency"
              options={[...COMPENSATION_CURRENCY_OPTIONS]}
            />
          </div>
          <SelectField
            control={form.control}
            name="frequency"
            label="Frequency"
            options={[...COMPENSATION_FREQUENCY_OPTIONS]}
          />
          <DatePickerField
            control={form.control}
            name="effectiveDate"
            label="Effective from"
            description="Must be after the current record’s effective date"
          />
          <TextareaField
            control={form.control}
            name="description"
            label="Reason"
            placeholder="Promotion, market adjustment, correction…"
            description="Stored on the new record for auditability"
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
              {mutation.isPending ? 'Saving…' : 'Save new compensation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
