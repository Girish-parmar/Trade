import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

export async function listProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(userId: string, name: string, description?: string) {
  return prisma.project.create({
    data: {
      name,
      description,
      ownerId: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
  });
}

export async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new HttpError(404, 'Project not found');
  }
  return project;
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string },
) {
  return prisma.project.update({ where: { id: projectId }, data });
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
}
