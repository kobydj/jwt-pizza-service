const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');


const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const testFranchise = {"name": "pizzaPocket", "admins": [{"email": "f@jwt.com"}]};
const testStore = {"franchiseId": 1, "name":"SLC"};
let testUserAuthToken;
let adminUser;
let adminAuth;

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
    testFranchise.name = Math.random().toString(36).substring(2, 12);

    await request(app).post('/api/auth').send(testUser);
    const loginRes = await request(app).put('/api/auth').send(testUser);
    testUserAuthToken = loginRes.body.token;
    adminUser = await createAdminUser();
    const adminRes = await request(app).put('/api/auth').send(adminUser)
    adminAuth = adminRes.body.token
  });

  test('get franchise', async () => {
    const franchiseRes = await request(app).get('/api/franchise');
    // console.log(franchiseRes)
    expect(franchiseRes.status).toBe(200);
  });

  test('make franchise', async () => {

    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(36).substring(2, 12);
    user.email = 'f@jwt.com';
  
    await DB.addUser(user);
  
    user.password = 'toomanysecrets';

    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuth}`).send(testFranchise);
    
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toHaveProperty('name');
  });

  test('make franchise not auth', async () => {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(36).substring(2, 12);
    user.email = 'f@jwt.com';
    await DB.addUser(user);
    user.password = 'toomanysecrets';
    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${testUserAuthToken}`).send(testFranchise);
  
    expect(franchiseRes.status).toBe(403);
  });

  test('delete franchise', async () => {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(35).substring(2, 12);
    user.email = 'f@jwt.com';

    await DB.addUser(user);
  
    user.password = 'toomanysecrets';
    testFranchise.name = Math.random().toString(30).substring(2, 12);

    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuth}`).send(testFranchise);
    const deleteRes = await request(app).delete(`/api/franchise/:${franchiseRes.body.id}`).set('Authorization', `Bearer ${adminAuth}`);

    expect(deleteRes.status).toBe(200);
  });

  

  test('create store not auth', async () => {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(35).substring(2, 12);
    user.email = 'f@jwt.com';

    await DB.addUser(user);
  
    user.password = 'toomanysecrets';
    const loginRes = await request(app).put('/api/auth').send(user);

    testFranchise.name = Math.random().toString(30).substring(2, 12);
    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuth}`).send(testFranchise);
    testStore.franchiseId = franchiseRes.body.id

    const storeRes = await request(app).post(`/api/franchise/:${franchiseRes.body.id}/store`).set('Authorization', `Bearer ${loginRes.body.token}`).send(testStore);

    expect(storeRes.status).toBe(403);
  });

  test('get franchise 2', async () => {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(35).substring(2, 12);
    user.email = 'f@jwt.com';

    let userDB = await DB.addUser(user);
    // console.log(userDB.id)
    user.password = 'toomanysecrets';
    testFranchise.name = Math.random().toString(30).substring(2, 12);
    const franchiseRes = await request(app).get(`/api/franchise/:${userDB.id}`).set('Authorization', `Bearer ${adminAuth}`);

    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toBeInstanceOf(Array);
   });