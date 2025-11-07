import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DeploymentCard from "@/components/DeploymentCard";
import HealthCheckPanel from "@/components/HealthCheckPanel";
import MetricCard from "@/components/MetricCard";
import DeploymentTimeline from "@/components/DeploymentTimeline";
import LogViewer from "@/components/LogViewer";
import TrafficSplitPanel from "@/components/TrafficSplitPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { Activity, TrendingUp, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Deployment {
  id: string;
  environment: string;
  version: string;
  commitHash: string;
  commitMessage: string | null;
  status: string;
  deployedAt: Date | null;
  healthCheckStatus: string | null;
  metrics: any;
}

interface HealthCheck {
  id: string;
  deploymentId: string;
  endpoint: string;
  status: string;
  responseTime: number | null;
  checkedAt: Date | null;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch current deployments
  const { data: currentDeployments, isLoading: deploymentsLoading } = useQuery<{
    blue: Deployment | null;
    green: Deployment | null;
  }>({
    queryKey: ["/api/deployments/current"],
  });

  // Fetch all deployments for history
  const { data: allDeployments = [] } = useQuery<Deployment[]>({
    queryKey: ["/api/deployments"],
  });

  // Fetch health checks
  const { data: healthChecks = [] } = useQuery<HealthCheck[]>({
    queryKey: ["/api/health-checks"],
  });

  // Fetch logs
  const { data: logs = [] } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
  });

  // Fetch traffic split
  const { data: trafficSplit } = useQuery<{ blue: number; green: number }>({
    queryKey: ["/api/traffic-split"],
  });

  // Fetch metrics
  const { data: metrics } = useQuery<{
    totalDeployments: number;
    successRate: number;
    avgDeployTime: string;
    uptime: number;
  }>({
    queryKey: ["/api/metrics"],
  });

  // Promote deployment mutation
  const promoteMutation = useMutation({
    mutationFn: async (deploymentId: string) => {
      return await apiRequest("POST", `/api/deployments/promote/${deploymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deployments/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/traffic-split"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Promotion Successful",
        description: "Environment has been promoted to production.",
      });
    },
    onError: () => {
      toast({
        title: "Promotion Failed",
        description: "Failed to promote deployment.",
        variant: "destructive",
      });
    },
  });

  // Update traffic split mutation
  const updateTrafficMutation = useMutation({
    mutationFn: async ({ blue, green }: { blue: number; green: number }) => {
      return await apiRequest("POST", "/api/traffic-split", { blue, green });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/traffic-split"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Traffic Split Updated",
        description: "Traffic distribution has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update traffic split.",
        variant: "destructive",
      });
    },
  });

  // Rollback deployment mutation
  const rollbackMutation = useMutation({
    mutationFn: async (deploymentId: string) => {
      return await apiRequest("POST", `/api/deployments/rollback/${deploymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deployments/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/traffic-split"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Rollback Successful",
        description: "Successfully rolled back to previous deployment.",
      });
    },
    onError: () => {
      toast({
        title: "Rollback Failed",
        description: "Failed to rollback deployment.",
        variant: "destructive",
      });
    },
  });

  const handlePromoteGreen = () => {
    if (currentDeployments?.green?.id) {
      promoteMutation.mutate(currentDeployments.green.id);
    }
  };

  const handlePromoteBlue = () => {
    if (currentDeployments?.blue?.id) {
      promoteMutation.mutate(currentDeployments.blue.id);
    }
  };

  const handleRollback = (deploymentId: string) => {
    rollbackMutation.mutate(deploymentId);
  };

  const handleApplyTraffic = (bluePercentage: number) => {
    const greenPercentage = 100 - bluePercentage;
    updateTrafficMutation.mutate({ blue: bluePercentage, green: greenPercentage });
  };

  const handleRefreshLogs = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    toast({ title: "Logs Refreshed" });
  };

  const handleDownloadLogs = () => {
    const logsText = logs.map(log => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloading Logs..." });
  };

  // Format health checks for the panel
  const formattedHealthChecks = healthChecks.map(hc => ({
    endpoint: hc.endpoint,
    status: hc.status as "passing" | "failing" | "pending",
    responseTime: hc.responseTime || 0,
    lastCheck: hc.checkedAt ? new Date(hc.checkedAt).toLocaleString() : "Never",
  }));

  // Format deployment history
  const deploymentHistory = allDeployments.slice(0, 10).map(d => ({
    id: d.id,
    version: d.version,
    environment: d.environment as "blue" | "green",
    commitHash: d.commitHash,
    commitMessage: d.commitMessage || "",
    status: d.healthCheckStatus === "healthy" ? "success" as const : "failed" as const,
    timestamp: d.deployedAt ? new Date(d.deployedAt).toLocaleString() : "",
    duration: "3m 42s",
  }));

  if (deploymentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading deployment data...</p>
        </div>
      </div>
    );
  }

  const blueEnv = currentDeployments?.blue;
  const greenEnv = currentDeployments?.green;
  const currentTraffic = trafficSplit || { blue: 100, green: 0 };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-chart-1 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-2xl font-bold">Atlas</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Deployment Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage your AWS Elastic Beanstalk blue/green deployments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Deployments"
            value={metrics?.totalDeployments || 0}
            trend="up"
            trendValue="+12%"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            label="Success Rate"
            value={`${metrics?.successRate || 0}%`}
            trend="up"
            trendValue="+2.1%"
            icon={<Activity className="w-4 h-4" />}
          />
          <MetricCard
            label="Avg Deploy Time"
            value={metrics?.avgDeployTime || "0m"}
            trend="down"
            trendValue="-0.8m"
            icon={<Clock className="w-4 h-4" />}
          />
          <MetricCard
            label="Uptime"
            value={`${metrics?.uptime || 0}%`}
            trend="stable"
            trendValue="Stable"
            icon={<Zap className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blueEnv && (
                <DeploymentCard
                  environment="blue"
                  version={blueEnv.version}
                  commitHash={blueEnv.commitHash}
                  commitMessage={blueEnv.commitMessage || "No message"}
                  status={blueEnv.status as any}
                  healthStatus={blueEnv.healthCheckStatus as any || "healthy"}
                  trafficPercentage={currentTraffic.blue}
                  onPromote={blueEnv.status === "idle" ? handlePromoteBlue : undefined}
                  onRollback={blueEnv.status === "active" ? () => handleRollback(blueEnv.id) : undefined}
                />
              )}
              {greenEnv && (
                <DeploymentCard
                  environment="green"
                  version={greenEnv.version}
                  commitHash={greenEnv.commitHash}
                  commitMessage={greenEnv.commitMessage || "No message"}
                  status={greenEnv.status as any}
                  healthStatus={greenEnv.healthCheckStatus as any || "healthy"}
                  trafficPercentage={currentTraffic.green}
                  onPromote={greenEnv.status === "idle" ? handlePromoteGreen : undefined}
                  onRollback={greenEnv.status === "active" ? () => handleRollback(greenEnv.id) : undefined}
                />
              )}
            </div>

            <HealthCheckPanel checks={formattedHealthChecks} />
            <LogViewer
              logs={logs}
              onRefresh={handleRefreshLogs}
              onDownload={handleDownloadLogs}
            />
          </div>

          <div className="space-y-6">
            <TrafficSplitPanel
              blueTraffic={currentTraffic.blue}
              onApplyTraffic={handleApplyTraffic}
            />
            <DeploymentTimeline items={deploymentHistory} onRollback={(id) => handleRollback(id)} />
          </div>
        </div>
      </main>
    </div>
  );
}
