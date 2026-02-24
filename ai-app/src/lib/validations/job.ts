import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requiredSkills: z.array(z.string()).min(1, 'Add at least one required skill'),
  department: z.string().min(1, 'Department is required'),
  experienceLevel: z.enum(['entry', 'mid', 'senior'], {
    required_error: 'Experience level is required',
  }),
  salaryRange: z.object({
    min: z.number().min(0, 'Minimum salary must be positive'),
    max: z.number().min(0, 'Maximum salary must be positive'),
  }).refine((data) => data.max >= data.min, {
    message: 'Maximum salary must be greater than minimum',
  }),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
});

export type JobInput = z.infer<typeof jobSchema>;
