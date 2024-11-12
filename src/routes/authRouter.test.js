const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const badUser = { name: null, email: 'reg@test.com', password: 'a' };

let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  expect(testUserAuthToken).not.toMatch(loginRes.body.token)
  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(password).not.toBe(null)
  expect(loginRes.body.user).toMatchObject(user);
  await request(app).delete('/api/auth').set(`Authorization`,  `Bearer ${loginRes.body.token}`);
});

test('logout', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    const logoutRes = await request(app).delete('/api/auth').set(`Authorization`,  `Bearer ${loginRes.body.token}`);
    expect(logoutRes.status).toBe(200);
});

test('register wrong', async () => {
    badUser.email = null;
    const registerRes = await request(app).post('/api/auth').send(badUser);
    testUserAuthToken = registerRes.body.token;
    expect(registerRes.status).toBe(400);
});

// test('create auth user', async () => {
//     badUser.email = null;
//     const registerRes = await request(app).post('/api/auth').send(badUser);
//     testUserAuthToken = registerRes.body.token;
//     expect(registerRes.status).toBe(400);
// });