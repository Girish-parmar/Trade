import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { verifyProjectScoped } from '../../middleware/verifyProjectScoped';
import { createTaskSchema, listTasksQuerySchema, moveTaskSchema, updateTaskSchema } from './tasks.schemas';
import {
  completeTaskHandler,
  createTaskHandler,
  deleteTaskHandler,
  getTaskHandler,
  listTasksHandler,
  moveTaskHandler,
  updateTaskHandler,
} from './tasks.controller';

const router = Router({ mergeParams: true });

router.param(
  'taskId',
  verifyProjectScoped((id) => prisma.task.findUnique({ where: { id } }), 'Task'),
);

router.get('/', validate(listTasksQuerySchema), listTasksHandler);
router.post('/', validate(createTaskSchema), createTaskHandler);
router.get('/:taskId', getTaskHandler);
router.patch('/:taskId', validate(updateTaskSchema), updateTaskHandler);
router.delete('/:taskId', deleteTaskHandler);
router.patch('/:taskId/complete', completeTaskHandler);
router.patch('/:taskId/move', validate(moveTaskSchema), moveTaskHandler);

export default router;
