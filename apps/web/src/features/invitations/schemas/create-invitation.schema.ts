import { z } from 'zod';

export const createInvitationSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    role: z.string().min(1, 'Role is required'),
    type: z.enum(['USER', 'EMPLOYEE']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startingSalary: z.number().min(0, 'Salary must be 0 or greater').optional(),
    salaryCurrency: z.string().min(1).default('USD'),
    salaryFrequency: z
      .enum([
        'HOURLY',
        'WEEKLY',
        'BIWEEKLY',
        'SEMIMONTHLY',
        'MONTHLY',
        'QUARTERLY',
        'ANNUALLY',
        'ONE_TIME',
      ])
      .default('ANNUALLY'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'EMPLOYEE') {
      if (data.startingSalary == null || Number.isNaN(data.startingSalary)) {
        ctx.addIssue({
          code: 'custom',
          path: ['startingSalary'],
          message: 'Starting salary is required for employee invites',
        });
      }
      if (!data.department) {
        ctx.addIssue({
          code: 'custom',
          path: ['department'],
          message: 'Department is required for employee invites',
        });
      }
      if (!data.position) {
        ctx.addIssue({
          code: 'custom',
          path: ['position'],
          message: 'Role / title is required for employee invites',
        });
      }
    }
  });

export type CreateInvitationFormValues = z.infer<
  typeof createInvitationSchema
>;
