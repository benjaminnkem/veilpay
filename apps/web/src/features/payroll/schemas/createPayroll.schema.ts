import { z } from 'zod';

export const createPayrollSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
  payDate: z.string().min(1, 'Pay date is required'),
  notes: z.string().optional(),
});

export type CreatePayrollFormValues = z.infer<typeof createPayrollSchema>;
