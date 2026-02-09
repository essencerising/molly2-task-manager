import { z } from 'zod';

export const updateTaskSchema = z.object({
    title: z.string().min(1, 'A cím nem lehet üres'),
    description: z.string().nullable().optional(),
    assignee_id: z.string().nullable().optional(),
    assignee_email: z.string().email('Érvénytelen e-mail cím').nullable().optional().or(z.literal('')),
    follow_up_at: z.string().nullable().optional(), // ISO date string
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const createPersonSchema = z.object({
    name: z.string().min(1, 'A név kötelező'),
    email: z.string().email('Érvénytelen e-mail cím').optional().or(z.literal('')),
    area: z.string().optional(),
    recurrence_type: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'none']).optional(),
    recurrence_interval: z.number().min(1).optional(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
