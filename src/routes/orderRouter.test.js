const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');


const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
//const testOrder = {"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]};
const testMenuItem = { "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 };
let testUserAuthToken;
let adminUser;

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = Math.random().toString(36).substring(2, 12);
  user.email = user.name + '@admin.com';

  await DB.addUser(user);

  user.password = 'toomanysecrets';
  return user;
}

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  await request(app).post('/api/auth').send(testUser);
  const loginRes = await request(app).put('/api/auth').send(testUser);
  testUserAuthToken = loginRes.body.token;
  adminUser = await createAdminUser();

});

test('get menu', async () => {
    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toBeInstanceOf(Array); 
  });

test('add menu item not auth', async () => {
    const orderRes = await request(app).put('/api/order/menu').send(testMenuItem);
    expect(orderRes.status).toBe(401);
  });

test('add menu item with auth', async () => {
    const adminRes = await request(app).put('/api/auth').send(adminUser)
    const orderRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminRes.body.token}`).send(testMenuItem);
  
    expect(orderRes.status).toBe(200);
    expect(orderRes.body[0]).toMatchObject(testMenuItem);
  });

  test('get orders with auth', async () => {
    const ordersRes = await request(app)
      .get('/api/order')
      .set('Authorization', `Bearer ${testUserAuthToken}`);
  
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.body).toHaveProperty('orders');
    expect(ordersRes.body.orders).toBeInstanceOf(Array);
  });

  test('add menu item not admin', async () => {
    const newMenuItem = {
      title: 'Test Pizza',
      description: 'A test pizza with no toppings',
      image: 'pizza10.png',
      price: 0.01,
    };
  
    const addMenuRes = await request(app)
      .put('/api/order/menu')
      .set('Authorization', `Bearer ${testUserAuthToken}`)
      .send(newMenuItem);
  
    expect(addMenuRes.status).toBe(403); // Expect forbidden for non-admin users
  });