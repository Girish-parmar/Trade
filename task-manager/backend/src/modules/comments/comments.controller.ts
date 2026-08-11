import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as commentsService from './comments.service';

export const listCommentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const comments = await commentsService.listComments(req.params.taskId);
  res.json({ comments });
});

export const createCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentsService.createComment(req.params.taskId, req.user!.id, req.body.body);
  res.status(201).json({ comment });
});

export const updateCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentsService.updateComment(
    req.params.commentId,
    req.user!.id,
    req.body.body,
  );
  res.json({ comment });
});

export const deleteCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  await commentsService.deleteComment(req.params.commentId, req.user!.id);
  res.status(204).send();
});
