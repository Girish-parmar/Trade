import { TaskPriority } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

const POSITION_GAP = 1024;

interface TemplateItemInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueOffsetDays?: number;
}

export async function listTemplates(projectId: string) {
  return prisma.taskTemplate.findMany({
    where: { projectId },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTemplate(templateId: string) {
  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!template) {
    throw new HttpError(404, 'Template not found');
  }
  return template;
}

export async function createTemplate(
  projectId: string,
  name: string,
  description: string | undefined,
  items: TemplateItemInput[],
) {
  return prisma.taskTemplate.create({
    data: {
      projectId,
      name,
      description,
      items: {
        create: items.map((item, index) => ({
          title: item.title,
          description: item.description,
          priority: item.priority ?? 'MEDIUM',
          dueOffsetDays: item.dueOffsetDays,
          order: index,
        })),
      },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  });
}

export async function updateTemplate(
  templateId: string,
  data: { name?: string; description?: string; items?: TemplateItemInput[] },
) {
  return prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.templateItem.deleteMany({ where: { templateId } });
    }
    return tx.taskTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        description: data.description,
        items: data.items
          ? {
              create: data.items.map((item, index) => ({
                title: item.title,
                description: item.description,
                priority: item.priority ?? 'MEDIUM',
                dueOffsetDays: item.dueOffsetDays,
                order: index,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  });
}

export async function deleteTemplate(templateId: string) {
  await prisma.taskTemplate.delete({ where: { id: templateId } });
}

export async function instantiateTemplate(
  templateId: string,
  projectId: string,
  creatorId: string,
  dueDateBase?: string,
) {
  const template = await getTemplate(templateId);
  const baseDate = dueDateBase ? new Date(dueDateBase) : new Date();

  const last = await prisma.task.findFirst({
    where: { projectId, status: 'TODO' },
    orderBy: { position: 'desc' },
  });
  let position = last?.position ?? 0;

  const createdTasks = await prisma.$transaction(
    template.items.map((item) => {
      position += POSITION_GAP;
      const dueDate =
        item.dueOffsetDays != null
          ? new Date(baseDate.getTime() + item.dueOffsetDays * 86_400_000)
          : undefined;
      return prisma.task.create({
        data: {
          projectId,
          creatorId,
          title: item.title,
          description: item.description,
          priority: item.priority,
          dueDate,
          status: 'TODO',
          position,
        },
      });
    }),
  );

  return createdTasks;
}
