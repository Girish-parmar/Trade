import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createTaskSchema, moveTaskSchema, updateTaskSchema } from './tasks.schemas';
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

router.get('/', listTasksHandler);
router.post('/', validate(createTaskSchema), createTaskHandler);
router.get('/:taskId', getTaskHandler);
router.patch('/:taskId', validate(updateTaskSchema), updateTaskHandler);
router.delete('/:taskId', deleteTaskHandler);
router.patch('/:taskId/complete', completeTaskHandler);
router.patch('/:taskId/move', validate(moveTaskSchema), moveTaskHandler);

export default router;
