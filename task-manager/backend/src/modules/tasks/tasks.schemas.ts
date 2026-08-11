import { z } from 'zod';

const statusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().datetime().optional(),
    assigneeId: z.string().uuid().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(5000).nullable().optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().datetime().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  }),
});

export const moveTaskSchema = z.object({
  body: z.object({
    status: statusEnum,
    beforeId: z.string().uuid().optional(),
    afterId: z.string().uuid().optional(),
  }),
});

export const listTasksQuerySchema = z.object({
  query: z.object({
    status: statusEnum.optional(),
    assigneeId: z.string().uuid().optional(),
    tagId: z.string().uuid().optional(),
    priority: priorityEnum.optional(),
    search: z.string().optional(),
    dueBefore: z.string().datetime().optional(),
    dueAfter: z.string().datetime().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});
