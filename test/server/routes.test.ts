import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

type Deployment = {
  id?: string;
  environment: string;
  version: string;
  commitHash: string;
  status: string;
};

describe('API Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('GET /health', () => {
    it('should return health status and metadata', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('trafficSplit');
    });
  });

  describe('GET /api/deployments', () => {
    it('should return list of deployments', async () => {
      const res = await request(app).get('/api/deployments');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/deployments', () => {
    it('should create new deployment', async () => {
      const deployment: Partial<Deployment> = {
        environment: 'blue',
        version: 'v1.0.0',
        commitHash: 'abc123',
        status: 'idle'
      };

      const res = await request(app)
        .post('/api/deployments')
        .send(deployment);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.environment).toBe('blue');
      expect(res.body.version).toBe('v1.0.0');
    });

    it('should validate deployment data', async () => {
      const res = await request(app)
        .post('/api/deployments')
        .send({ invalid: true });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/traffic-split', () => {
    it('should return traffic split configuration', async () => {
      const res = await request(app).get('/api/traffic-split');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('blue');
      expect(res.body).toHaveProperty('green');
      expect(res.body.blue + res.body.green).toBe(100);
    });
  });

  describe('POST /api/deployments/promote/:id', () => {
    it('should promote deployment and update traffic', async () => {
      // Create a deployment first
      const createRes = await request(app)
        .post('/api/deployments')
        .send({
          environment: 'green',
          version: 'v2.0.0',
          commitHash: 'def456',
          status: 'idle'
        });
      
      const deploymentId = createRes.body.id;

      // Promote it
      const res = await request(app)
        .post(`/api/deployments/promote/${deploymentId}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');

      // Verify traffic split updated
      const trafficRes = await request(app).get('/api/traffic-split');
      expect(trafficRes.body.green).toBe(100);
      expect(trafficRes.body.blue).toBe(0);
    });
  });
});