import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

const ROLE_RANK: Record<Role, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export function requireProjectMember(minRole: Role = 'MEMBER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Missing projectId' });
    }
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }
    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: 'Insufficient project role' });
    }
    req.projectRole = membership.role;
    next();
  };
}
