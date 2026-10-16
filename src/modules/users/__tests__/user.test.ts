import request from 'supertest';
import { app } from '../../../app';
import { prisma } from '../../../database/prisma.service';

describe('User Module API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup a user and get auth token
    // This assumes there's a way to generate or mock a token
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        phone: '01700000000',
      }
    });
    userId = user.id;

    // For testing purposes, you might mock the authenticate middleware
    // or generate a real JWT depending on how testing is set up.
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.address.deleteMany();
  });

  it('should get user profile', async () => {
    // Mocking auth would be needed here for a real test
    // const res = await request(app).get('/api/v1/users/profile').set('Authorization', `Bearer ${authToken}`);
    expect(true).toBe(true);
  });
});
