import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notifications.service';

const POSITION_GAP = 1024;

export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
  tagId?: string;
  priority?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
}

const taskInclude = {
  tags: { include: { tag: true } },
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
} satisfies Prisma.TaskInclude;

function serializeTask(task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>) {
  return { ...task, tags: task.tags.map((t) => t.tag) };
}

export async function listTasks(projectId: string, filters: TaskFilters) {
  const where: Prisma.TaskWhereInput = { projectId };
  if (filters.status) where.status = filters.status;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.priority) where.priority = filters.priority as Prisma.TaskWhereInput['priority'];
  if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {
      ...(filters.dueBefore ? { lte: new Date(filters.dueBefore) } : {}),
      ...(filters.dueAfter ? { gte: new Date(filters.dueAfter) } : {}),
    };
  }
  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { position: 'asc' }],
  });
  return tasks.map(serializeTask);
}

async function nextPositionForColumn(projectId: string, status: TaskStatus) {
  const last = await prisma.task.findFirst({
    where: { projectId, status },
    orderBy: { position: 'desc' },
  });
  return (last?.position ?? 0) + POSITION_GAP;
}

export async function createTask(
  projectId: string,
  creatorId: string,
  data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    assigneeId?: string;
    tagIds?: string[];
  },
) {
  const status = data.status ?? 'TODO';
  const position = await nextPositionForColumn(projectId, status);
  const task = await prisma.task.create({
    data: {
      projectId,
      creatorId,
      title: data.title,
      description: data.description,
      status,
      priority: data.priority ?? 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assigneeId: data.assigneeId,
      position,
      tags: data.tagIds ? { create: data.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: taskInclude,
  });
  if (data.assigneeId && data.assigneeId !== creatorId) {
    await createNotification({
      userId: data.assigneeId,
      type: 'ASSIGNED',
      message: `You were assigned to "${task.title}"`,
      taskId: task.id,
    });
  }
  return serializeTask(task);
}

export async function getTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
  if (!task) {
    throw new HttpError(404, 'Task not found');
  }
  return serializeTask(task);
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string | null;
    assigneeId?: string | null;
    tagIds?: string[];
  },
) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) {
    throw new HttpError(404, 'Task not found');
  }

  const task = await prisma.$transaction(async (tx) => {
    if (data.tagIds) {
      await tx.taskTag.deleteMany({ where: { taskId } });
    }
    return tx.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description === null ? null : data.description,
        priority: data.priority,
        dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
        assigneeId: data.assigneeId === null ? null : data.assigneeId,
        tags: data.tagIds ? { create: data.tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: taskInclude,
    });
  });

  if (
    data.assigneeId &&
    data.assigneeId !== existing.assigneeId &&
    data.assigneeId !== existing.creatorId
  ) {
    await createNotification({
      userId: data.assigneeId,
      type: 'ASSIGNED',
      message: `You were assigned to "${task.title}"`,
      taskId: task.id,
    });
  }

  return serializeTask(task);
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
}

export async function completeTask(taskId: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: 'DONE', completedAt: new Date() },
    include: taskInclude,
  });
  return serializeTask(task);
}

export async function moveTask(
  taskId: string,
  projectId: string,
  status: TaskStatus,
  beforeId?: string,
  afterId?: string,
) {
  const [before, after] = await Promise.all([
    beforeId ? prisma.task.findUnique({ where: { id: beforeId } }) : null,
    afterId ? prisma.task.findUnique({ where: { id: afterId } }) : null,
  ]);

  let position: number;
  if (before && after) {
    position = (before.position + after.position) / 2;
  } else if (before) {
    position = before.position + POSITION_GAP;
  } else if (after) {
    position = after.position - POSITION_GAP;
  } else {
    position = await nextPositionForColumn(projectId, status);
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      position,
      completedAt: status === 'DONE' ? new Date() : null,
    },
    include: taskInclude,
  });
  return serializeTask(task);
}
