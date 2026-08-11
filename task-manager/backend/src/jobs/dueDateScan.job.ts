import { prisma } from '../lib/prisma';
import { createNotification } from '../modules/notifications/notifications.service';

const DAY_MS = 86_400_000;

export async function runDueDateScan(now: Date = new Date()) {
  const soonThreshold = new Date(now.getTime() + DAY_MS);
  const oneDayAgo = new Date(now.getTime() - DAY_MS);

  const dueSoonTasks = await prisma.task.findMany({
    where: {
      status: { not: 'DONE' },
      dueDate: { gte: now, lte: soonThreshold },
    },
  });

  for (const task of dueSoonTasks) {
    const recipientId = task.assigneeId ?? task.creatorId;
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        userId: recipientId,
        type: 'DUE_SOON',
        createdAt: { gte: oneDayAgo },
      },
    });
    if (!alreadyNotified) {
      await createNotification({
        userId: recipientId,
        type: 'DUE_SOON',
        message: `"${task.title}" is due soon`,
        taskId: task.id,
      });
    }
  }

  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { not: 'DONE' },
      dueDate: { lt: now },
    },
  });

  for (const task of overdueTasks) {
    const recipientId = task.assigneeId ?? task.creatorId;
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        userId: recipientId,
        type: 'OVERDUE',
        createdAt: { gte: oneDayAgo },
      },
    });
    if (!alreadyNotified) {
      await createNotification({
        userId: recipientId,
        type: 'OVERDUE',
        message: `"${task.title}" is overdue`,
        taskId: task.id,
      });
    }
  }

  return { dueSoonCount: dueSoonTasks.length, overdueCount: overdueTasks.length };
}
