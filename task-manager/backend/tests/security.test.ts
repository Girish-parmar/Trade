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

describe('cross-project isolation (IDOR)', () => {
  it('404s when accessing a task via a project it does not belong to', async () => {
    const ownerToken = await registerUser('iso1@example.com', 'Owner1');
    const projectA = await createProject(ownerToken, 'Project A');
    const projectB = await createProject(ownerToken, 'Project B');

    const taskInB = await request(app)
      .post(`/api/projects/${projectB}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Secret task in B' });
    const taskId = taskInB.body.task.id as string;

    const crossRead = await request(app)
      .get(`/api/projects/${projectA}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(crossRead.status).toBe(404);

    const crossUpdate = await request(app)
      .patch(`/api/projects/${projectA}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'hijacked' });
    expect(crossUpdate.status).toBe(404);

    const crossDelete = await request(app)
      .delete(`/api/projects/${projectA}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(crossDelete.status).toBe(404);

    // Task in B is untouched
    const stillThere = await request(app)
      .get(`/api/projects/${projectB}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.task.title).toBe('Secret task in B');
  });

  it('404s when accessing a template via another project', async () => {
    const token = await registerUser('iso2@example.com', 'Owner2');
    const projectA = await createProject(token, 'Templates A');
    const projectB = await createProject(token, 'Templates B');

    const template = await request(app)
      .post(`/api/projects/${projectB}/templates`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'B Template', items: [{ title: 'Item 1' }] });
    const templateId = template.body.template.id as string;

    const crossGet = await request(app)
      .get(`/api/projects/${projectA}/templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(crossGet.status).toBe(404);

    const crossInstantiate = await request(app)
      .post(`/api/projects/${projectA}/templates/${templateId}/instantiate`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(crossInstantiate.status).toBe(404);
  });

  it('404s when accessing a tag via another project', async () => {
    const token = await registerUser('iso3@example.com', 'Owner3');
    const projectA = await createProject(token, 'Tags A');
    const projectB = await createProject(token, 'Tags B');

    const tag = await request(app)
      .post(`/api/projects/${projectB}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'urgent', color: '#ff0000' });
    const tagId = tag.body.tag.id as string;

    const crossUpdate = await request(app)
      .patch(`/api/projects/${projectA}/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'hijacked' });
    expect(crossUpdate.status).toBe(404);
  });

  it('404s when modifying a member via another project', async () => {
    const token = await registerUser('iso4@example.com', 'Owner4');
    const projectA = await createProject(token, 'Members A');
    const projectB = await createProject(token, 'Members B');

    const outsiderToken = await registerUser('iso4b@example.com', 'MemberB');
    const outsiderSearch = await request(app)
      .get('/api/users/search?q=iso4b@example.com')
      .set('Authorization', `Bearer ${token}`);
    expect(outsiderSearch.body.users).toHaveLength(1);

    const addMember = await request(app)
      .post(`/api/projects/${projectB}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'iso4b@example.com', role: 'MEMBER' });
    const memberId = addMember.body.member.id as string;
    void outsiderToken;

    const crossRemove = await request(app)
      .delete(`/api/projects/${projectA}/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(crossRemove.status).toBe(404);
  });

  it('rejects assigning a task to a non-member and tagging with another project\'s tag', async () => {
    const token = await registerUser('iso5@example.com', 'Owner5');
    const nonMemberToken = await registerUser('iso5b@example.com', 'NonMember');
    void nonMemberToken;
    const projectA = await createProject(token, 'Assign A');
    const projectB = await createProject(token, 'Assign B');

    const nonMember = await request(app)
      .get('/api/users/search?q=iso5b@example.com')
      .set('Authorization', `Bearer ${token}`);
    const nonMemberId = nonMember.body.users[0].id as string;

    const badAssign = await request(app)
      .post(`/api/projects/${projectA}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad assign', assigneeId: nonMemberId });
    expect(badAssign.status).toBe(400);

    const tagInB = await request(app)
      .post(`/api/projects/${projectB}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'b-tag', color: '#00ff00' });
    const tagId = tagInB.body.tag.id as string;

    const badTag = await request(app)
      .post(`/api/projects/${projectA}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad tag', tagIds: [tagId] });
    expect(badTag.status).toBe(400);
  });

  it('accepts a duplicated valid tag id instead of rejecting it as foreign', async () => {
    const token = await registerUser('iso5c@example.com', 'DupeTagOwner');
    const projectId = await createProject(token, 'Dupe Tag Project');

    const tag = await request(app)
      .post(`/api/projects/${projectId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'dup-tag', color: '#123456' });
    const tagId = tag.body.tag.id as string;

    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Dupe tag task', tagIds: [tagId, tagId] });
    expect(created.status).toBe(201);
    expect(created.body.task.tags).toHaveLength(1);
  });

  it('ignores move neighbors from another project instead of using their position', async () => {
    const token = await registerUser('iso6@example.com', 'Owner6');
    const projectA = await createProject(token, 'Move A');
    const projectB = await createProject(token, 'Move B');

    const taskInB = await request(app)
      .post(`/api/projects/${projectB}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'B task' });
    const foreignTaskId = taskInB.body.task.id as string;

    const taskInA = await request(app)
      .post(`/api/projects/${projectA}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'A task' });
    const ownTaskId = taskInA.body.task.id as string;

    const move = await request(app)
      .patch(`/api/projects/${projectA}/tasks/${ownTaskId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS', afterId: foreignTaskId });
    expect(move.status).toBe(200);
    // Falls back to append-to-column behavior (position > 0), not derived
    // from the foreign task's position.
    expect(move.body.task.position).toBeGreaterThan(0);
  });

  it('prevents removing or demoting the project owner membership', async () => {
    const token = await registerUser('iso7@example.com', 'Owner7');
    const projectId = await createProject(token, 'Owner Guard');

    const members = await request(app)
      .get(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`);
    const ownerMemberId = members.body.members[0].id as string;

    const demote = await request(app)
      .patch(`/api/projects/${projectId}/members/${ownerMemberId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'MEMBER' });
    expect(demote.status).toBe(403);

    const remove = await request(app)
      .delete(`/api/projects/${projectId}/members/${ownerMemberId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(403);
  });
});
