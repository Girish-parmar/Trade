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

describe('tasks', () => {
  it('supports full CRUD, filters, and enforces project membership', async () => {
    const ownerToken = await registerUser('owner@example.com', 'Owner');
    const outsiderToken = await registerUser('outsider@example.com', 'Outsider');
    const projectId = await createProject(ownerToken, 'Test Project');

    const outsiderList = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(outsiderList.status).toBe(403);

    const create = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Write docs', priority: 'HIGH' });
    expect(create.status).toBe(201);
    const taskId = create.body.task.id as string;
    expect(create.body.task.status).toBe('TODO');

    const update = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Write great docs' });
    expect(update.status).toBe(200);
    expect(update.body.task.title).toBe('Write great docs');

    const filtered = await request(app)
      .get(`/api/projects/${projectId}/tasks?priority=HIGH`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.tasks).toHaveLength(1);

    const complete = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(complete.status).toBe(200);
    expect(complete.body.task.status).toBe('DONE');

    const del = await request(app)
      .delete(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(del.status).toBe(204);
  });

  it('computes move positions for first/last/middle/empty column', async () => {
    const ownerToken = await registerUser('mover@example.com', 'Mover');
    const projectId = await createProject(ownerToken, 'Move Project');

    const create = (title: string) =>
      request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title })
        .then((r) => r.body.task);

    const a = await create('A');
    const b = await create('B');
    const c = await create('C');

    // Move c to an empty IN_PROGRESS column
    const toEmpty = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${c.id}/move`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(toEmpty.status).toBe(200);
    expect(toEmpty.body.task.status).toBe('IN_PROGRESS');

    // Move b to sit immediately before a in the TODO column (afterId = the
    // neighbor that should end up after the moved task).
    const beforeA = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${b.id}/move`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'TODO', afterId: a.id });
    expect(beforeA.status).toBe(200);
    expect(beforeA.body.task.position).toBeLessThan(a.position);
  });
});
