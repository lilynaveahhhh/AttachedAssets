import { type Deployment, type HealthCheck, type InsertDeployment, type InsertHealthCheck } from "@shared/schema";
import { migrations } from "../shared/migrations/migrations";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface SerializedDeployment extends Omit<Deployment, 'deployedAt'> {
  deployedAt: string | null;
}

export interface SerializedHealthCheck extends Omit<HealthCheck, 'checkedAt'> {
  checkedAt: string | null;
}

export interface StorageData {
  deployments: SerializedDeployment[];
  healthChecks: SerializedHealthCheck[];
  logs: LogEntry[];
  trafficSplit: { blue: number; green: number };
  schemaVersion: number;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface IStorage {
  // Deployment operations
  getDeployments(): Promise<Deployment[]>;
  getDeploymentById(id: string): Promise<Deployment | undefined>;
  getDeploymentsByEnvironment(environment: string): Promise<Deployment[]>;
  getPreviousDeployment(environment: string): Promise<Deployment | undefined>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined>;
  rollbackToDeployment(deploymentId: string): Promise<void>;
  
  // Health check operations
  getHealthChecks(deploymentId: string): Promise<HealthCheck[]>;
  createHealthCheck(healthCheck: InsertHealthCheck): Promise<HealthCheck>;
  
  // Log operations
  getLogs(deploymentId?: string): Promise<LogEntry[]>;
  addLog(log: LogEntry): Promise<void>;
  
  // Traffic management
  getTrafficSplit(): Promise<{ blue: number; green: number }>;
  updateTrafficSplit(blue: number, green: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private deployments: Map<string, Deployment>;
  private healthChecks: Map<string, HealthCheck>;
  private logs: LogEntry[];
  private trafficSplit: { blue: number; green: number };
  private schemaVersion: number = 1;

  constructor() {
    this.deployments = new Map();
    this.healthChecks = new Map();
    this.logs = [];
    this.trafficSplit = { blue: 100, green: 0 };
    // Attempt to load persisted state from disk, otherwise initialize sample data
    void this.loadFromDisk().catch(async () => {
      this.initializeSampleData();
      await this.saveToDisk().catch(() => undefined);
    });
  }

  private get dataFilePath() {
    // store data in project/server/storage-data.json
    return path.resolve(process.cwd(), "server", "storage-data.json");
  }

  private async validateSchema(): Promise<boolean> {
    const currentMigration = migrations.find(m => m.version === this.schemaVersion);
    if (!currentMigration) {
      return false;
    }
    return await currentMigration.validate();
  }

  private async upgradeSchema(targetVersion: number): Promise<void> {
    if (targetVersion < this.schemaVersion) {
      throw new Error("Downgrade not supported");
    }

    // Run migrations in sequence
    for (const migration of migrations) {
      if (migration.version > this.schemaVersion && migration.version <= targetVersion) {
        await migration.up();
        this.schemaVersion = migration.version;
        await this.saveToDisk();
        
        // Log migration
        await this.addLog({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `Applied migration ${migration.version}: ${migration.description}`
        });
      }
    }
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const file = await fs.readFile(this.dataFilePath, "utf-8");
      const parsed = JSON.parse(file) as StorageData;

      // Check if schema needs upgrade
      if (parsed.schemaVersion !== this.schemaVersion) {
        await this.upgradeSchema(parsed.schemaVersion);
      }

      // Validate schema
      const isValid = await this.validateSchema();
      if (!isValid) {
        throw new Error("Invalid schema detected");
      }

      // restore deployments
      this.deployments = new Map(parsed.deployments.map(d => [d.id, {
        ...d,
        deployedAt: d.deployedAt ? new Date(d.deployedAt) : undefined
      } as Deployment]));

      // restore health checks
      this.healthChecks = new Map(parsed.healthChecks.map(h => [h.id, {
        ...h,
        checkedAt: h.checkedAt ? new Date(h.checkedAt) : undefined
      } as HealthCheck]));

      // restore logs and traffic
      this.logs = parsed.logs || [];
      this.trafficSplit = parsed.trafficSplit;
      this.schemaVersion = parsed.schemaVersion;
    } catch (err) {
      // If there is any error reading the file, surface it to caller so constructor can fallback
      throw err;
    }
  }

  private async saveToDisk(): Promise<void> {
    try {
      // Validate schema before saving
      const isValid = await this.validateSchema();
      if (!isValid) {
        throw new Error("Invalid schema detected before save");
      }

      const data: StorageData = {
        deployments: Array.from(this.deployments.values()).map(d => ({ ...d, deployedAt: d.deployedAt ? d.deployedAt.toISOString() : null })),
        healthChecks: Array.from(this.healthChecks.values()).map(h => ({ ...h, checkedAt: h.checkedAt ? h.checkedAt.toISOString() : null })),
        logs: this.logs,
        trafficSplit: this.trafficSplit,
        schemaVersion: this.schemaVersion
      };
      
      await fs.mkdir(path.dirname(this.dataFilePath), { recursive: true });
      await fs.writeFile(this.dataFilePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      // don't throw in production operations; log to console for debugging
      // eslint-disable-next-line no-console
      console.warn("Failed to persist storage to disk:", (err as any)?.message ?? err);
      
      // Log the error
      void this.addLog({
        timestamp: new Date().toLocaleTimeString(),
        level: "error",
        message: `Failed to persist storage: ${(err as any)?.message ?? err}`
      });
    }
  }

  private initializeSampleData() {
    // Create initial deployments
    const blueDeployment: Deployment = {
      id: randomUUID(),
      environment: "blue",
      version: "v2.4.1",
      commitHash: "a3f7b2c",
      commitMessage: "Fix authentication bug",
      status: "active",
      deployedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      healthCheckStatus: "healthy",
      metrics: {
        successRate: 98.5,
        avgResponseTime: 120,
        uptime: 99.98
      }
    };

    const greenDeployment: Deployment = {
      id: randomUUID(),
      environment: "green",
      version: "v2.5.0",
      commitHash: "d9e1c4a",
      commitMessage: "Add new dashboard features",
      status: "idle",
      deployedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      healthCheckStatus: "healthy",
      metrics: {
        successRate: 99.2,
        avgResponseTime: 105,
        uptime: 100
      }
    };

    this.deployments.set(blueDeployment.id, blueDeployment);
    this.deployments.set(greenDeployment.id, greenDeployment);

    // Create health checks
    [blueDeployment, greenDeployment].forEach(deployment => {
      ["/health", "/api/users", "/api/products", "/metrics"].forEach(endpoint => {
        const healthCheck: HealthCheck = {
          id: randomUUID(),
          deploymentId: deployment.id,
          endpoint,
          status: "passing",
          responseTime: Math.floor(Math.random() * 100) + 50,
          checkedAt: new Date()
        };
        this.healthChecks.set(healthCheck.id, healthCheck);
      });
    });

    // Initialize logs
    this.logs = [
      { timestamp: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Starting deployment to green environment" },
      { timestamp: new Date(Date.now() - 29 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Building application artifacts..." },
      { timestamp: new Date(Date.now() - 28 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Artifact build completed successfully" },
      { timestamp: new Date(Date.now() - 27 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Uploading to S3 bucket..." },
      { timestamp: new Date(Date.now() - 26 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Creating application version v2.5.0" },
      { timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString(), level: "warn", message: "Environment capacity at 80%" },
      { timestamp: new Date(Date.now() - 24 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Deploying to Elastic Beanstalk..." },
      { timestamp: new Date(Date.now() - 23 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Health check initiated" },
      { timestamp: new Date(Date.now() - 22 * 60 * 1000).toLocaleTimeString(), level: "info", message: "All health checks passed" },
      { timestamp: new Date(Date.now() - 21 * 60 * 1000).toLocaleTimeString(), level: "info", message: "Deployment completed successfully" },
    ];
  }

  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).sort((a, b) => 
      new Date(b.deployedAt!).getTime() - new Date(a.deployedAt!).getTime()
    );
  }

  async getDeploymentById(id: string): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async getDeploymentsByEnvironment(environment: string): Promise<Deployment[]> {
    return Array.from(this.deployments.values())
      .filter(d => d.environment === environment)
      .sort((a, b) => new Date(b.deployedAt!).getTime() - new Date(a.deployedAt!).getTime());
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = randomUUID();
    const deployment: Deployment = {
      id,
      environment: insertDeployment.environment,
      version: insertDeployment.version,
      commitHash: insertDeployment.commitHash,
      commitMessage: insertDeployment.commitMessage ?? null,
      status: insertDeployment.status,
      deployedAt: new Date(),
      healthCheckStatus: insertDeployment.healthCheckStatus ?? null,
      metrics: insertDeployment.metrics ?? null
    };
    this.deployments.set(id, deployment);
    
    // Add log entry
    this.addLog({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `Deployment ${deployment.version} created for ${deployment.environment} environment`
    });
    await this.saveToDisk().catch(() => undefined);
    return deployment;
  }

  async updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updated = { ...deployment, ...updates };
    this.deployments.set(id, updated);
    
    // Add log entry
    this.addLog({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `Deployment ${deployment.version} updated: ${JSON.stringify(updates)}`
    });
    await this.saveToDisk().catch(() => undefined);
    return updated;
  }

  async getPreviousDeployment(environment: string): Promise<Deployment | undefined> {
    const envDeployments = await this.getDeploymentsByEnvironment(environment);
    // Return the second most recent deployment (first one would be current)
    return envDeployments[1];
  }

  async rollbackToDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.getDeploymentById(deploymentId);
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    // Get all deployments
    const allDeployments = await this.getDeployments();
    
    // Update the target deployment to active
    await this.updateDeployment(deploymentId, { status: "active" });
    
    // Set ALL other deployments to idle (not just same environment)
    // This ensures only one deployment is active across all environments
    for (const d of allDeployments) {
      if (d.id !== deploymentId) {
        await this.updateDeployment(d.id, { status: "idle" });
      }
    }

    // Update traffic split to route 100% to the rolled-back environment
    if (deployment.environment === "blue") {
      await this.updateTrafficSplit(100, 0);
    } else if (deployment.environment === "green") {
      await this.updateTrafficSplit(0, 100);
    }

    // Add log entry
    this.addLog({
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: `Rolled back to ${deployment.environment} environment: ${deployment.version} (${deployment.commitHash}). All traffic now routing to ${deployment.environment}.`
    });

    await this.saveToDisk().catch(() => undefined);
  }

  async getHealthChecks(deploymentId: string): Promise<HealthCheck[]> {
    return Array.from(this.healthChecks.values())
      .filter(hc => hc.deploymentId === deploymentId);
  }

  async createHealthCheck(insertHealthCheck: InsertHealthCheck): Promise<HealthCheck> {
    const id = randomUUID();
    const healthCheck: HealthCheck = {
      id,
      deploymentId: insertHealthCheck.deploymentId,
      endpoint: insertHealthCheck.endpoint,
      status: insertHealthCheck.status,
      responseTime: insertHealthCheck.responseTime ?? null,
      checkedAt: new Date()
    };
    this.healthChecks.set(id, healthCheck);
    await this.saveToDisk().catch(() => undefined);
    return healthCheck;
  }

  async getLogs(deploymentId?: string): Promise<LogEntry[]> {
    // For now, return all logs. In a real implementation, you'd filter by deployment
    return [...this.logs].reverse();
  }

  async addLog(log: LogEntry): Promise<void> {
    this.logs.push(log);
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    await this.saveToDisk().catch(() => undefined);
  }

  async getTrafficSplit(): Promise<{ blue: number; green: number }> {
    return { ...this.trafficSplit };
  }

  async updateTrafficSplit(blue: number, green: number): Promise<void> {
    this.trafficSplit = { blue, green };
    
    // Add log entry
    this.addLog({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `Traffic split updated: ${blue}% blue, ${green}% green`
    });
    await this.saveToDisk().catch(() => undefined);
  }
}

export const storage = new MemStorage();
