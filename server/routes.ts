import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDeploymentSchema, insertHealthCheckSchema } from "@shared/schema";
import { z } from "zod";
import { LogManager } from './lib/logging';
import { metricsMonitor } from './middleware/monitoring';

export async function registerRoutes(app: Express): Promise<Server> {
  // Health endpoint for readiness/liveness checks
  app.get("/health", async (_req, res) => {
    try {
      // basic app/process info
      const uptime = process.uptime();
      const traffic = await storage.getTrafficSplit();
      const deployments = await storage.getDeployments();
      const active = deployments.find(d => d.status === "active") || null;

      res.json({
        status: "ok",
        uptimeSeconds: Math.floor(uptime),
        activeDeployment: active,
        trafficSplit: traffic,
        commit: process.env.COMMIT_HASH || null
      });
    } catch (err) {
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

  // Get all deployments
  app.get("/api/deployments", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  // Get deployments by environment
  app.get("/api/deployments/environment/:env", async (req, res) => {
    try {
      const { env } = req.params;
      const deployments = await storage.getDeploymentsByEnvironment(env);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  // Get current deployment for each environment
  app.get("/api/deployments/current", async (req, res) => {
    try {
      const [blueDeployments, greenDeployments] = await Promise.all([
        storage.getDeploymentsByEnvironment("blue"),
        storage.getDeploymentsByEnvironment("green")
      ]);

      res.json({
        blue: blueDeployments[0] || null,
        green: greenDeployments[0] || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current deployments" });
    }
  });

  // Create a new deployment
  app.post("/api/deployments", async (req, res) => {
    try {
      const validatedData = insertDeploymentSchema.parse(req.body);
      const deployment = await storage.createDeployment(validatedData);
      res.status(201).json(deployment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid deployment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create deployment" });
      }
    }
  });

  // Update deployment (promote, rollback, etc.)
  app.patch("/api/deployments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const deployment = await storage.updateDeployment(id, updates);
      
      if (!deployment) {
        res.status(404).json({ error: "Deployment not found" });
        return;
      }
      
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deployment" });
    }
  });

  // Promote deployment (swap environments)
  app.post("/api/deployments/promote/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deployment = await storage.getDeploymentById(id);
      
      if (!deployment) {
        res.status(404).json({ error: "Deployment not found" });
        return;
      }

      // Update statuses
      const allDeployments = await storage.getDeployments();
      for (const d of allDeployments) {
        if (d.id === id) {
          await storage.updateDeployment(d.id, { status: "active" });
        } else if (d.environment !== deployment.environment) {
          await storage.updateDeployment(d.id, { status: "idle" });
        }
      }

      // Update traffic split
      if (deployment.environment === "green") {
        await storage.updateTrafficSplit(0, 100);
      } else {
        await storage.updateTrafficSplit(100, 0);
      }

      res.json({ message: "Deployment promoted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to promote deployment" });
    }
  });

  // Rollback to a previous deployment
  app.post("/api/deployments/rollback/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deployment = await storage.getDeploymentById(id);
      
      if (!deployment) {
        res.status(404).json({ error: "Deployment not found" });
        return;
      }

      await storage.rollbackToDeployment(id);
      
      // Fetch updated deployment state
      const updatedDeployment = await storage.getDeploymentById(id);
      
      res.json({ 
        message: "Rollback successful",
        deployment: {
          id: deployment.id,
          version: deployment.version,
          environment: deployment.environment,
          status: updatedDeployment?.status || "active"
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to rollback deployment";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get health checks for a deployment
  app.get("/api/health-checks/:deploymentId", async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const healthChecks = await storage.getHealthChecks(deploymentId);
      res.json(healthChecks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health checks" });
    }
  });

  // Get all health checks for current deployments
  app.get("/api/health-checks", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      const activeDeployment = deployments.find(d => d.status === "active");
      
      if (!activeDeployment) {
        res.json([]);
        return;
      }

      const healthChecks = await storage.getHealthChecks(activeDeployment.id);
      res.json(healthChecks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health checks" });
    }
  });

  // Create health check
  app.post("/api/health-checks", async (req, res) => {
    try {
      const validatedData = insertHealthCheckSchema.parse(req.body);
      const healthCheck = await storage.createHealthCheck(validatedData);
      res.status(201).json(healthCheck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid health check data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create health check" });
      }
    }
  });

  // Get logs
  app.get("/api/logs", async (req, res) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Get traffic split
  app.get("/api/traffic-split", async (req, res) => {
    try {
      const trafficSplit = await storage.getTrafficSplit();
      res.json(trafficSplit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traffic split" });
    }
  });

  // Update traffic split
  app.post("/api/traffic-split", async (req, res) => {
    try {
      const { blue, green } = req.body;
      
      if (typeof blue !== "number" || typeof green !== "number") {
        res.status(400).json({ error: "Invalid traffic split values" });
        return;
      }
      
      if (blue + green !== 100) {
        res.status(400).json({ error: "Traffic split must total 100%" });
        return;
      }
      
      await storage.updateTrafficSplit(blue, green);
      res.json({ blue, green });
    } catch (error) {
      res.status(500).json({ error: "Failed to update traffic split" });
    }
  });

  // Get deployment metrics/statistics
  app.get("/api/metrics", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      const activeDeployment = deployments.find(d => d.status === "active");
      
      const totalDeployments = deployments.length;
      const successfulDeployments = deployments.filter(d => d.status === "active" || d.healthCheckStatus === "healthy").length;
      const successRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments * 100).toFixed(1) : "0.0";
      
      // Get real-time metrics
      const metrics = activeDeployment ? {
        errorRate: metricsMonitor.getErrorRate(activeDeployment.id),
        avgLatency: metricsMonitor.getAverageLatency(activeDeployment.id),
        successRate: metricsMonitor.getSuccessRate(activeDeployment.id)
      } : null;
      
      res.json({
        totalDeployments,
        successRate: parseFloat(successRate),
        avgDeployTime: "4.2m",
        uptime: 99.98,
        realtimeMetrics: metrics
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get structured logs with filtering
  app.get("/api/logs/structured", async (req, res) => {
    try {
      const { level, traceId, startTime, endTime } = req.query;
      const logger = LogManager.getInstance();
      
      const filter: any = {};
      if (level) filter.level = level;
      if (traceId) filter.traceId = traceId;
      if (startTime) filter.startTime = new Date(startTime as string);
      if (endTime) filter.endTime = new Date(endTime as string);
      
      const logs = logger.getLogs(filter);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch structured logs" });
    }
  });

  // Get detailed deployment audit trail
  app.get("/api/deployments/:id/audit", async (req, res) => {
    try {
      const { id } = req.params;
      const deployment = await storage.getDeploymentById(id);
      
      if (!deployment) {
        res.status(404).json({ error: "Deployment not found" });
        return;
      }

      const healthChecks = await storage.getHealthChecks(id);
      const logger = LogManager.getInstance();
      const logFilter: any = {
        startTime: deployment.deployedAt ?? undefined,
        metadata: { deploymentId: id }
      };
      const logs = logger.getLogs(logFilter);

      res.json({
        deployment,
        healthChecks,
        logs,
        metrics: {
          errorRate: metricsMonitor.getErrorRate(id),
          avgLatency: metricsMonitor.getAverageLatency(id),
          successRate: metricsMonitor.getSuccessRate(id)
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployment audit trail" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
