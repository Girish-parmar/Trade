import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { prisma } from '../../lib/prisma';

export const listTagsHandler = asyncHandler(async (req: Request, res: Response) => {
  const tags = await prisma.tag.findMany({ where: { projectId: req.params.projectId } });
  res.json({ tags });
});

export const createTagHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, color } = req.body;
  const tag = await prisma.tag.create({
    data: { projectId: req.params.projectId, name, color },
  });
  res.status(201).json({ tag });
});

export const updateTagHandler = asyncHandler(async (req: Request, res: Response) => {
  const tag = await prisma.tag.update({ where: { id: req.params.tagId }, data: req.body });
  res.json({ tag });
});

export const deleteTagHandler = asyncHandler(async (req: Request, res: Response) => {
  await prisma.tag.delete({ where: { id: req.params.tagId } });
  res.status(204).send();
});
