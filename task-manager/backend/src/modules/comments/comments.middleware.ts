import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { asyncHandler } from '../../middleware/errorHandler';

export const requireTaskAccess = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) {
      throw new HttpError(404, 'Task not found');
    }
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user!.id } },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this task\'s project');
    }
    req.projectRole = membership.role;
    next();
  },
);
