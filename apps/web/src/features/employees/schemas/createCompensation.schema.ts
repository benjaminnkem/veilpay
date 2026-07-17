import { z } from 'zod';

export const COMPENSATION_TYPE_OPTIONS = [
  { label: 'Salary', value: 'SALARY' },
  { label: 'Bonus', value: 'BONUS' },
  { label: 'Allowance', value: 'ALLOWANCE' },
] as const;

export const COMPENSATION_FREQUENCY_OPTIONS = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Semi-monthly', value: 'SEMIMONTHLY' },
  { label: 'Biweekly', value: 'BIWEEKLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Annually', value: 'ANNUALLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Hourly', value: 'HOURLY' },
  { label: 'One-time', value: 'ONE_TIME' },
] as const;

export const COMPENSATION_CURRENCY_OPTIONS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'NGN', value: 'NGN' },
  { label: 'USDC', value: 'USDC' },
] as const;

export const createCompensationSchema = z.object({
  type: z.enum(['SALARY', 'BONUS', 'ALLOWANCE']),
  amount: z
    .number({ error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  currency: z.string().min(1, 'Currency is required'),
  frequency: z.enum([
    'HOURLY',
    'WEEKLY',
    'BIWEEKLY',
    'SEMIMONTHLY',
    'MONTHLY',
    'QUARTERLY',
    'ANNUALLY',
    'ONE_TIME',
  ]),
  effectiveDate: z.date({ error: 'Effective date is required' }),
  description: z.string().optional(),
});

export type CreateCompensationFormValues = z.infer<
  typeof createCompensationSchema
>;
