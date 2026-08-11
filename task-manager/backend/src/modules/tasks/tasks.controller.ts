import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as tasksService from './tasks.service';

export const listTasksHandler = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await tasksService.listTasks(req.params.projectId, {
    status: req.query.status as never,
    assigneeId: req.query.assigneeId as string | undefined,
    tagId: req.query.tagId as string | undefined,
    priority: req.query.priority as string | undefined,
    search: req.query.search as string | undefined,
    dueBefore: req.query.dueBefore as string | undefined,
    dueAfter: req.query.dueAfter as string | undefined,
  });
  res.json({ tasks });
});

export const createTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.createTask(req.params.projectId, req.user!.id, req.body);
  res.status(201).json({ task });
});

export const getTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.getTask(req.params.taskId);
  res.json({ task });
});

export const updateTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.updateTask(req.params.taskId, req.body);
  res.json({ task });
});

export const deleteTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  await tasksService.deleteTask(req.params.taskId);
  res.status(204).send();
});

export const completeTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.completeTask(req.params.taskId);
  res.json({ task });
});

export const moveTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status, beforeId, afterId } = req.body;
  const task = await tasksService.moveTask(
    req.params.taskId,
    req.params.projectId,
    status,
    beforeId,
    afterId,
  );
  res.json({ task });
});
