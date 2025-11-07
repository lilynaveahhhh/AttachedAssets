import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCommit, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";

interface TimelineItem {
  id: string;
  version: string;
  environment: "blue" | "green";
  commitHash: string;
  commitMessage: string;
  status: "success" | "failed" | "in-progress";
  timestamp: string;
  duration?: string;
}

interface DeploymentTimelineProps {
  items: TimelineItem[];
  onRollback?: (id: string) => void;
}

export default function DeploymentTimeline({ items, onRollback }: DeploymentTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-chart-2" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-chart-4 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-chart-2 text-white text-xs">Success</Badge>;
      case "failed":
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case "in-progress":
        return <Badge className="bg-chart-4 text-white text-xs">In Progress</Badge>;
    }
  };

  return (
    <Card data-testid="card-deployment-timeline">
      <CardHeader>
        <CardTitle className="text-lg">Deployment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex gap-4 pb-4 border-l-2 border-border pl-4 relative"
              data-testid={`timeline-item-${index}`}
            >
              <div className="absolute -left-[9px] top-0 bg-background">
                {getStatusIcon(item.status)}
              </div>
              <div className="flex flex-col gap-2 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.version}</span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.environment === "blue" ? "bg-chart-1" : "bg-chart-2"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground capitalize">
                        {item.environment}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GitCommit className="w-3 h-3" />
                      <span className="font-mono">{item.commitHash}</span>
                      <span>•</span>
                      <span className="max-w-[300px] truncate">{item.commitMessage}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    {item.status === "success" && onRollback && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRollback(item.id)}
                        data-testid={`button-rollback-${item.id}`}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.timestamp}</span>
                  {item.duration && (
                    <>
                      <span>•</span>
                      <span>{item.duration}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
