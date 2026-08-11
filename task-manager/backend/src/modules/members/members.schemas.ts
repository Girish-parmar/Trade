import { z } from 'zod';

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  }),
});

export const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  }),
});
