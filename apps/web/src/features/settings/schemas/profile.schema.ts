import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Enter a valid email address'),
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
