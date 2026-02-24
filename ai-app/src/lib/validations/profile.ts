import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  duration: z.string().min(1, 'Duration is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  current: z.boolean().optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  techStack: z.array(z.string()).min(1, 'Add at least one technology'),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
  experience: z.array(experienceSchema).min(1, 'Add at least one experience'),
  projects: z.array(projectSchema).optional(),
  extracurriculars: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
