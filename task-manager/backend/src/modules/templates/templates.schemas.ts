import { z } from 'zod';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const templateItemSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  priority: priorityEnum.optional(),
  dueOffsetDays: z.number().int().min(0).max(3650).optional(),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    items: z.array(templateItemSchema).min(1).max(50),
  }),
});

export const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    items: z.array(templateItemSchema).min(1).max(50).optional(),
  }),
});

export const instantiateTemplateSchema = z.object({
  body: z.object({
    dueDateBase: z.string().datetime().optional(),
  }),
});
