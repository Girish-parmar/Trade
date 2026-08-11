import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('auth', () => {
  it('registers, logs in, accesses /me, refreshes, and logs out', async () => {
    const register = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
      name: 'Alice',
    });
    expect(register.status).toBe(201);
    expect(register.body.accessToken).toBeDefined();
    const cookie = register.headers['set-cookie'];

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${register.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('alice@example.com');

    const noToken = await request(app).get('/api/auth/me');
    expect(noToken.status).toBe(401);

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeDefined();

    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logout.status).toBe(204);
  });

  it('rejects duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'password123', name: 'Bob' });
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'password123', name: 'Bob2' });
    expect(dup.status).toBe(409);
  });

  it('rejects login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'carol@example.com', password: 'password123', name: 'Carol' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'wrongpass' });
    expect(login.status).toBe(401);
  });
});
