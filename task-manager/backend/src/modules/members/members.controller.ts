import { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../../middleware/errorHandler';
import { prisma } from '../../lib/prisma';

export const listMembersHandler = asyncHandler(async (req: Request, res: Response) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.projectId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
  res.json({ members });
});

export const addMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(404, 'No user found with that email');
  }
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: req.params.projectId, userId: user.id } },
  });
  if (existing) {
    throw new HttpError(409, 'User is already a member of this project');
  }
  const member = await prisma.projectMember.create({
    data: { projectId: req.params.projectId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
  res.status(201).json({ member });
});

export const updateMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const member = await prisma.projectMember.update({
    where: { id: req.params.memberId },
    data: { role: req.body.role },
  });
  res.json({ member });
});

export const removeMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  await prisma.projectMember.delete({ where: { id: req.params.memberId } });
  res.status(204).send();
});
