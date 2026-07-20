'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ComboboxField, InputField } from '@/components/forms';
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
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
} from '@/features/employees/constants/options';
import { employeesQueryKey } from '@/features/employees/hooks/use-employees';
import { updateEmployee } from '@/features/employees/services/updateEmployee';
import type { Employee } from '@/features/employees/types';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  walletAddress: z.string().optional(),
  hireDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditEmployeeDialog({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department ?? '',
      position: employee.position ?? employee.title ?? '',
      phone: employee.phone ?? '',
      country: employee.country ?? '',
      walletAddress: employee.walletAddress ?? '',
      hireDate: employee.hireDate ?? '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: FormValues) =>
      updateEmployee(employee.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        department: values.department || null,
        position: values.position || null,
        phone: values.phone || null,
        country: values.country || null,
        walletAddress: values.walletAddress || null,
        hireDate: values.hireDate || null,
      }),
    onSuccess: async () => {
      notify.success('Employee updated');
      await qc.invalidateQueries({ queryKey: employeesQueryKey });
      await qc.invalidateQueries({ queryKey: ['employees', employee.id] });
      setOpen(false);
    },
    onError: (e) => notify.error(e),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        Edit profile
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>
            Update directory fields. Compensation is managed separately.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutateAsync(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField control={form.control} name="firstName" label="First name" />
            <InputField control={form.control} name="lastName" label="Last name" />
          </div>
          <InputField control={form.control} name="email" label="Email" type="email" />
          <div className="grid gap-4 sm:grid-cols-2">
            <ComboboxField
              control={form.control}
              name="department"
              label="Department"
              options={DEPARTMENT_OPTIONS}
              placeholder="Department"
            />
            <ComboboxField
              control={form.control}
              name="position"
              label="Position"
              options={ROLE_OPTIONS}
              placeholder="Position"
            />
          </div>
          <InputField control={form.control} name="hireDate" label="Hire date" type="date" />
          <InputField control={form.control} name="phone" label="Phone" />
          <InputField control={form.control} name="country" label="Country" />
          <InputField control={form.control} name="walletAddress" label="Wallet address" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
