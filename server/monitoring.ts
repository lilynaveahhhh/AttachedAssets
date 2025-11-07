import { HealthCheck } from "@shared/schema";

export interface MetricThresholds {
  errorRate: number;  // percentage
  maxLatency: number; // milliseconds
  minSuccessRate: number; // percentage
  minUptime: number; // percentage
}

export const defaultThresholds: MetricThresholds = {
  errorRate: 5, // 5% error rate threshold
  maxLatency: 1000, // 1 second max latency
  minSuccessRate: 95, // 95% minimum success rate
  minUptime: 99, // 99% minimum uptime
};

export class MetricsMonitor {
  private healthChecks: Map<string, HealthCheck[]> = new Map();
  private readonly windowSize = 5 * 60 * 1000; // 5 minute window

  addHealthCheck(check: HealthCheck): void {
    const checks = this.healthChecks.get(check.deploymentId) || [];
    checks.push(check);
    
    // Keep only checks within the window
    const now = Date.now();
    const filtered = checks.filter(c => 
      now - c.checkedAt!.getTime() <= this.windowSize
    );
    
    this.healthChecks.set(check.deploymentId, filtered);
  }

  getErrorRate(deploymentId: string): number {
    const checks = this.healthChecks.get(deploymentId) || [];
    if (checks.length === 0) return 0;

    const failedChecks = checks.filter(c => c.status === 'failing');
    return (failedChecks.length / checks.length) * 100;
  }

  getAverageLatency(deploymentId: string): number {
    const checks = this.healthChecks.get(deploymentId) || [];
    if (checks.length === 0) return 0;

    const totalLatency = checks.reduce((sum, check) => 
      sum + (check.responseTime || 0), 0);
    return totalLatency / checks.length;
  }

  getSuccessRate(deploymentId: string): number {
    const checks = this.healthChecks.get(deploymentId) || [];
    if (checks.length === 0) return 100;

    const successfulChecks = checks.filter(c => c.status === 'passing');
    return (successfulChecks.length / checks.length) * 100;
  }

  shouldAbortPromotion(deploymentId: string, thresholds: MetricThresholds = defaultThresholds): boolean {
    const errorRate = this.getErrorRate(deploymentId);
    const avgLatency = this.getAverageLatency(deploymentId);
    const successRate = this.getSuccessRate(deploymentId);

    return (
      errorRate > thresholds.errorRate ||
      avgLatency > thresholds.maxLatency ||
      successRate < thresholds.minSuccessRate
    );
  }

  clearOldChecks(): void {
    const now = Date.now();
    Array.from(this.healthChecks.entries()).forEach(([deploymentId, checks]) => {
      const filtered = checks.filter((check: HealthCheck) => 
        now - (check.checkedAt?.getTime() ?? 0) <= this.windowSize
      );
      this.healthChecks.set(deploymentId, filtered);
    });
  }
}