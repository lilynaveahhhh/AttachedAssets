import { LogEntry } from '../storage';

export interface StructuredLog extends LogEntry {
  traceId: string;
  spanId: string;
  metadata: Record<string, unknown>;
}

export class LogManager {
  private logs: StructuredLog[] = [];
  private static instance: LogManager;

  private constructor() {}

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  log(
    level: "info" | "warn" | "error" | "debug",
    message: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: metadata.traceId as string || crypto.randomUUID(),
      spanId: metadata.spanId as string || crypto.randomUUID(),
      metadata
    };
    
    this.logs.push(log);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prettyMetadata = Object.entries(metadata)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      
      console.log(`[${log.timestamp}] ${log.level.toUpperCase()} ${log.message} ${prettyMetadata}`);
    }
  }

  getLogs(
    filter?: {
      level?: "info" | "warn" | "error" | "debug";
      traceId?: string;
      startTime?: Date;
      endTime?: Date;
    }
  ): StructuredLog[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.traceId) {
        filtered = filtered.filter(log => log.traceId === filter.traceId);
      }
      if (filter.startTime) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= filter.startTime!);
      }
      if (filter.endTime) {
        filtered = filtered.filter(log => new Date(log.timestamp) <= filter.endTime!);
      }
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
  }
}