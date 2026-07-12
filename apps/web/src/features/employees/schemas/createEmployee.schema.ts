import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Enter a valid email address'),
  department: z.string().min(1, 'Department is required'),
  title: z.string().min(1, 'Title is required'),
  hireDate: z.date({ error: 'Hire date is required' }),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;
