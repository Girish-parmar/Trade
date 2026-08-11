import { prisma } from '../src/lib/prisma';
import { runDueDateScan } from '../src/jobs/dueDateScan.job';

describe('dueDateScan job', () => {
  it('creates exactly one DUE_SOON notification per task even if run twice', async () => {
    const user = await prisma.user.create({
      data: { email: 'scan@example.com', passwordHash: 'x', name: 'Scan User' },
    });
    const project = await prisma.project.create({
      data: { name: 'Scan Project', ownerId: user.id, members: { create: { userId: user.id, role: 'OWNER' } } },
    });
    const now = new Date();
    await prisma.task.create({
      data: {
        projectId: project.id,
        creatorId: user.id,
        title: 'Due soon task',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 1,
        dueDate: new Date(now.getTime() + 60 * 60 * 1000),
      },
    });

    const first = await runDueDateScan(now);
    expect(first.dueSoonCount).toBe(1);

    const second = await runDueDateScan(now);
    expect(second.dueSoonCount).toBe(1);

    const notifications = await prisma.notification.findMany({ where: { userId: user.id, type: 'DUE_SOON' } });
    expect(notifications).toHaveLength(1);
  });
});
