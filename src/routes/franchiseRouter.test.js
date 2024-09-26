const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const badUser = { name: null, email: 'reg@test.com', password: 'a' };

let testUserAuthToken;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    const loginRes = await request(app).put('/api/auth').send(testUser);
    testUserAuthToken = loginRes.body.token;

  });
  test('get franchise', async () => {
    const franchiseRes = await request(app).get('/api/franchise');
    expect(franchiseRes.status).toBe(200);
  });

//   test('make franchise', async () => {
//     const franchiseRes = await request(app).put('/api/franchise').set(`Authorization`, `Bearer ${testUserAuthToken}`).send(testUser);
//     expect(franchiseRes.status).toBe(200);
//   });