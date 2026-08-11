import { prisma } from '../src/lib/prisma';

async function resetDatabase() {
  const tables = [
    'Notification',
    'TemplateItem',
    'TaskTemplate',
    'Comment',
    'TaskTag',
    'Task',
    'Tag',
    'ProjectMember',
    'Project',
    'RefreshToken',
    'User',
  ];
  await prisma.$transaction(
    tables.map((table) => prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)),
  );
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
