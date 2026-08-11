import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { prisma } from '../../lib/prisma';

export const searchUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    return res.json({ users: [] });
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true, avatarUrl: true },
    take: 10,
  });
  res.json({ users });
});
