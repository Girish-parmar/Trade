import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notifications.service';

const commentInclude = {
  author: { select: { id: true, name: true, email: true, avatarUrl: true } },
} as const;

export async function listComments(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(taskId: string, authorId: string, body: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new HttpError(404, 'Task not found');
  }
  const comment = await prisma.comment.create({
    data: { taskId, authorId, body },
    include: commentInclude,
  });

  const recipients = new Set<string>();
  if (task.assigneeId) recipients.add(task.assigneeId);
  recipients.add(task.creatorId);
  recipients.delete(authorId);

  await Promise.all(
    Array.from(recipients).map((userId) =>
      createNotification({
        userId,
        type: 'COMMENT_ADDED',
        message: `New comment on "${task.title}"`,
        taskId: task.id,
      }),
    ),
  );

  return comment;
}

export async function updateComment(commentId: string, authorId: string, body: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }
  if (comment.authorId !== authorId) {
    throw new HttpError(403, 'Only the comment author can edit this comment');
  }
  return prisma.comment.update({
    where: { id: commentId },
    data: { body },
    include: commentInclude,
  });
}

export async function deleteComment(commentId: string, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }
  if (comment.authorId !== authorId) {
    throw new HttpError(403, 'Only the comment author can delete this comment');
  }
  await prisma.comment.delete({ where: { id: commentId } });
}
