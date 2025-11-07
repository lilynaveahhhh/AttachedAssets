import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, CheckCircle2, XCircle, Clock, GitCommit, RotateCcw } from "lucide-react";

interface DeploymentCardProps {
  environment: "blue" | "green";
  version: string;
  commitHash: string;
  commitMessage: string;
  status: "active" | "idle" | "deploying" | "failed";
  healthStatus: "healthy" | "degraded" | "unhealthy";
  trafficPercentage?: number;
  onPromote?: () => void;
  onRollback?: () => void;
}

export default function DeploymentCard({
  environment,
  version,
  commitHash,
  commitMessage,
  status,
  healthStatus,
  trafficPercentage = 0,
  onPromote,
  onRollback,
}: DeploymentCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-chart-2 text-white">Active</Badge>;
      case "deploying":
        return <Badge className="bg-chart-4 text-white">Deploying</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  const getHealthIcon = () => {
    switch (healthStatus) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-chart-2" />;
      case "degraded":
        return <Clock className="w-4 h-4 text-chart-4" />;
      case "unhealthy":
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <Card data-testid={`card-deployment-${environment}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              environment === "blue" ? "bg-chart-1" : "bg-chart-2"
            }`}
          />
          <h3 className="text-lg font-semibold capitalize">{environment} Environment</h3>
        </div>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-mono font-semibold" data-testid={`text-version-${environment}`}>{version}</span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm text-muted-foreground">Commit</span>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <GitCommit className="w-3 h-3" />
                <span className="text-xs font-mono">{commitHash}</span>
              </div>
              <span className="text-xs text-muted-foreground max-w-[200px] text-right truncate">
                {commitMessage}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Health Status</span>
            <div className="flex items-center gap-1">
              {getHealthIcon()}
              <span className="text-sm font-medium capitalize">{healthStatus}</span>
            </div>
          </div>
          {trafficPercentage > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Traffic</span>
                <span className="text-sm font-semibold">{trafficPercentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-1 rounded-full transition-all"
                  style={{ width: `${trafficPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {status === "idle" && healthStatus === "healthy" && onPromote && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onPromote}
              data-testid={`button-promote-${environment}`}
            >
              <ArrowUpCircle className="w-4 h-4 mr-1" />
              Promote
            </Button>
          )}
          {status === "active" && onRollback && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onRollback}
              data-testid={`button-rollback-${environment}`}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Rollback
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
