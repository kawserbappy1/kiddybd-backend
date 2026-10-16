import request from 'supertest';
import { app } from '../../../app';

describe('Health Endpoints', () => {
  it('GET /health should return 200 OK with timestamp and uptime', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('GET /health/live should return 200 OK', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /health/ready should return 200 OK with db and redis status', async () => {
    const response = await request(app).get('/health/ready');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      db: 'connected',
      redis: 'connected',
    });
  });
});
