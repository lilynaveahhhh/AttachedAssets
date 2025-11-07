import { Request, Response, NextFunction } from 'express';
import { MetricsMonitor } from '../monitoring';
import { storage } from '../storage';
import { HealthCheck } from '@shared/schema';

export const metricsMonitor = new MetricsMonitor();

export async function monitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Store the original end function
  const originalEnd = res.end;
  
  // Override end function to capture response metrics
  res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Create a health check entry
    void storage.createHealthCheck({
      deploymentId: req.header('X-Deployment-ID') || 'unknown',
      endpoint: req.path,
      status: status >= 400 ? 'failing' : 'passing',
      responseTime: duration
    }).then(check => {
      metricsMonitor.addHealthCheck(check);
      
      // Check if we need to abort promotion
      if (metricsMonitor.shouldAbortPromotion(check.deploymentId)) {
        void storage.addLog({
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `Metrics threshold breached for deployment ${check.deploymentId}. Promotion will be aborted.`
        });
      }
    });
    
    // Call original end
    return originalEnd.apply(this, arguments as any);
  };
  
  next();
}