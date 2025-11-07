import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface HealthCheck {
  endpoint: string;
  status: "passing" | "failing" | "pending";
  responseTime: number;
  lastCheck: string;
}

interface HealthCheckPanelProps {
  checks: HealthCheck[];
}

export default function HealthCheckPanel({ checks }: HealthCheckPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passing":
        return <CheckCircle2 className="w-4 h-4 text-chart-2" />;
      case "failing":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "pending":
        return <Clock className="w-4 h-4 text-chart-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passing":
        return <Badge className="bg-chart-2 text-white text-xs">Passing</Badge>;
      case "failing":
        return <Badge variant="destructive" className="text-xs">Failing</Badge>;
      case "pending":
        return <Badge className="bg-chart-4 text-white text-xs">Pending</Badge>;
    }
  };

  return (
    <Card data-testid="card-health-checks">
      <CardHeader>
        <CardTitle className="text-lg">Health Checks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-md border hover-elevate"
              data-testid={`health-check-${index}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(check.status)}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-sm font-medium font-mono truncate">{check.endpoint}</span>
                  <span className="text-xs text-muted-foreground">{check.lastCheck}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{check.responseTime}ms</span>
                {getStatusBadge(check.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
