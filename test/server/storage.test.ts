import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { storage } from '../../server/storage';
import fs from 'fs/promises';
import path from 'path';

type Deployment = {
  id?: string;
  environment: 'blue' | 'green' | string;
  version?: string;
  commitHash?: string;
  status?: 'active' | 'idle' | string;
  deployedAt?: Date;
  healthCheckStatus?: string;
  metrics?: {
    successRate?: number;
    avgResponseTime?: number;
    uptime?: number;
  };
};

describe('Storage', () => {
  const testDataPath = path.resolve(process.cwd(), 'server', 'storage-data.test.json');
  
  beforeAll(async () => {
    // Clean up any existing test data file
    try {
      await fs.unlink(testDataPath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up test data file
    try {
      await fs.unlink(testDataPath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
  });

  describe('Deployments', () => {
    it('should create and retrieve deployments', async () => {
      const deployment: Deployment = {
        id: 'test-1',
        environment: 'blue',
        version: 'v1.0.0',
        commitHash: 'abc123',
        status: 'active',
        deployedAt: new Date(),
        healthCheckStatus: 'healthy',
        metrics: {
          successRate: 100,
          avgResponseTime: 50,
          uptime: 100
        }
      };

      // Create deployment
      const created = await storage.createDeployment(deployment);
      expect(created.id).toBeTruthy();
      expect(created.environment).toBe('blue');
      expect(created.version).toBe('v1.0.0');

      // Get all deployments
      const deployments = await storage.getDeployments();
      expect(deployments.length).toBeGreaterThan(0);
      expect(deployments.find(d => d.id === created.id)).toBeTruthy();

      // Get by environment
      const blueDeployments = await storage.getDeploymentsByEnvironment('blue');
      expect(blueDeployments.length).toBeGreaterThan(0);
      expect(blueDeployments[0].environment).toBe('blue');

      // Update deployment
      const updated = await storage.updateDeployment(created.id, { status: 'idle' });
      expect(updated?.status).toBe('idle');

      // Verify persistence
      const reloaded = await storage.getDeploymentById(created.id);
      expect(reloaded?.status).toBe('idle');
    });
  });

  describe('Health Checks', () => {
    it('should create and retrieve health checks', async () => {
      const deployment = await storage.createDeployment({
        environment: 'green',
        version: 'v1.1.0',
        commitHash: 'def456',
        status: 'active'
      });

      const healthCheck = await storage.createHealthCheck({
        deploymentId: deployment.id,
        endpoint: '/health',
        status: 'passing',
        responseTime: 42
      });

      expect(healthCheck.id).toBeTruthy();
      expect(healthCheck.status).toBe('passing');

      const checks = await storage.getHealthChecks(deployment.id);
      expect(checks.length).toBe(1);
      expect(checks[0].deploymentId).toBe(deployment.id);
    });
  });

  describe('Traffic Split', () => {
    it('should update and retrieve traffic split', async () => {
      await storage.updateTrafficSplit(60, 40);
      const split = await storage.getTrafficSplit();
      
      expect(split.blue).toBe(60);
      expect(split.green).toBe(40);
    });
  });

  describe('Rollback', () => {
    it('should rollback deployment and update traffic', async () => {
      // Create blue deployment
      const blue = await storage.createDeployment({
        environment: 'blue',
        version: 'v1.0.0',
        commitHash: 'abc123',
        status: 'idle'
      });

      // Create green deployment
      const green = await storage.createDeployment({
        environment: 'green',
        version: 'v2.0.0',
        commitHash: 'def456',
        status: 'active'
      });

      // Set initial traffic
      await storage.updateTrafficSplit(0, 100);

      // Rollback to blue
      await storage.rollbackToDeployment(blue.id);

      // Verify blue is now active
      const updatedBlue = await storage.getDeploymentById(blue.id);
      expect(updatedBlue?.status).toBe('active');

      // Verify green is now idle
      const updatedGreen = await storage.getDeploymentById(green.id);
      expect(updatedGreen?.status).toBe('idle');

      // Verify traffic is now 100% to blue
      const traffic = await storage.getTrafficSplit();
      expect(traffic.blue).toBe(100);
      expect(traffic.green).toBe(0);
    });
  });
});