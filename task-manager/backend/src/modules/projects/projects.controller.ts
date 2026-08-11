import { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../../middleware/errorHandler';
import * as projectsService from './projects.service';
import { prisma } from '../../lib/prisma';

export const listProjectsHandler = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectsService.listProjectsForUser(req.user!.id);
  res.json({ projects });
});

export const createProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const project = await projectsService.createProject(req.user!.id, name, description);
  res.status(201).json({ project });
});

export const getProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.getProject(req.params.projectId);
  res.json({ project });
});

export const updateProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.updateProject(req.params.projectId, req.body);
  res.json({ project });
});

export const deleteProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) throw new HttpError(404, 'Project not found');
  if (project.ownerId !== req.user!.id) {
    throw new HttpError(403, 'Only the project owner can delete the project');
  }
  await projectsService.deleteProject(req.params.projectId);
  res.status(204).send();
});
