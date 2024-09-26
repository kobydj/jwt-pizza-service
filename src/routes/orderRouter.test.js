const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const testOrder = {"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]};
//let testUserAuthToken;
//const loginRes = await request(app).put('/api/auth').send(testUser)

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  await request(app).post('/api/auth').send(testUser);
  //testUserAuthToken = registerRes.body.token;
});

test('get menu', async () => {
    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);
  });

  test('place order not auth', async () => {
    const orderRes = await request(app).put('/api/order').send(testOrder);
    expect(orderRes.status).toBe(404);
  });