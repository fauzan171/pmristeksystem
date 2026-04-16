import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  startDate: z.string().datetime().optional().nullable(),
  deadline: z.string().datetime('Valid deadline date is required'),
  waGroupName: z.string().optional(),
  waGroupId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  deadline: z.string().datetime().optional(),
  waGroupName: z.string().optional(),
  waGroupId: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['planning', 'ongoing', 'on_hold', 'completed']),
});

export const updateProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
});
