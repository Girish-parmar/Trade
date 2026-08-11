import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

async function registerUser(email: string, name: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name });
  return res.body.accessToken as string;
}

async function createProject(token: string, name: string) {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name });
  return res.body.project.id as string;
}

describe('templates', () => {
  it('instantiates a template into the correct number of tasks with offset due dates', async () => {
    const token = await registerUser('templater@example.com', 'Templater');
    const projectId = await createProject(token, 'Template Project');

    const create = await request(app)
      .post(`/api/projects/${projectId}/templates`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sprint Kickoff',
        items: [
          { title: 'Plan sprint', dueOffsetDays: 0 },
          { title: 'Groom backlog', dueOffsetDays: 1 },
          { title: 'Kickoff meeting', dueOffsetDays: 2 },
        ],
      });
    expect(create.status).toBe(201);
    const templateId = create.body.template.id as string;

    const baseDate = new Date('2026-01-01T00:00:00.000Z');
    const instantiate = await request(app)
      .post(`/api/projects/${projectId}/templates/${templateId}/instantiate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDateBase: baseDate.toISOString() });

    expect(instantiate.status).toBe(201);
    expect(instantiate.body.tasks).toHaveLength(3);
    const dueDates = instantiate.body.tasks.map((t: { dueDate: string }) => t.dueDate).sort();
    expect(new Date(dueDates[0]).getTime()).toBe(baseDate.getTime());
    expect(new Date(dueDates[2]).getTime()).toBe(baseDate.getTime() + 2 * 86_400_000);
  });

  it('rejects an empty items array', async () => {
    const token = await registerUser('emptytpl@example.com', 'Empty');
    const projectId = await createProject(token, 'Empty Project');

    const create = await request(app)
      .post(`/api/projects/${projectId}/templates`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Empty', items: [] });
    expect(create.status).toBe(400);
  });
});
