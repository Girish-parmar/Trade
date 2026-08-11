import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requireTaskAccess } from './comments.middleware';
import { createCommentSchema, updateCommentSchema } from './comments.schemas';
import {
  createCommentHandler,
  deleteCommentHandler,
  listCommentsHandler,
  updateCommentHandler,
} from './comments.controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use('/:taskId/comments', requireTaskAccess);

router.get('/:taskId/comments', listCommentsHandler);
router.post('/:taskId/comments', validate(createCommentSchema), createCommentHandler);
router.patch('/:taskId/comments/:commentId', validate(updateCommentSchema), updateCommentHandler);
router.delete('/:taskId/comments/:commentId', deleteCommentHandler);

export default router;
