'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { InputField } from '@/components/forms';
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
  createEmployeeSchema,
  type CreateEmployeeFormValues,
} from '@/features/employees/schemas/createEmployee.schema';
import { createEmployee } from '@/features/employees/services/createEmployee';
import { employeesQueryKey } from '@/features/employees/hooks/use-employees';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const form = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      title: '',
      hireDate: new Date(),
    },
  });

  const mutation = useApiMutation({
    mutationFn: createEmployee,
    onSuccess: async () => {
      notify.success('Employee created');
      await qc.invalidateQueries({ queryKey: employeesQueryKey });
      form.reset();
      setOpen(false);
    },
    onError: (error) => notify.error(error),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      department: values.department,
      position: values.title,
      hireDate: values.hireDate.toISOString().slice(0, 10),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Add employee
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>
            Create a workforce record. Invite them separately if they need login
            access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              control={form.control}
              name="firstName"
              label="First name"
            />
            <InputField
              control={form.control}
              name="lastName"
              label="Last name"
            />
          </div>
          <InputField
            control={form.control}
            name="email"
            label="Work email"
            type="email"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              control={form.control}
              name="department"
              label="Department"
            />
            <InputField control={form.control} name="title" label="Position" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
