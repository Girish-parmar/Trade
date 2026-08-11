import { z } from 'zod';

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex string like #a1b2c3'),
  }),
});

export const updateTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex string like #a1b2c3')
      .optional(),
  }),
});
