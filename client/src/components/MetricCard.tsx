import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
}

export default function MetricCard({ label, value, trend, trendValue, icon }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-3 h-3" />;
      case "down":
        return <ArrowDown className="w-3 h-3" />;
      case "stable":
        return <Minus className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-chart-2";
      case "down":
        return "text-destructive";
      case "stable":
        return "text-muted-foreground";
      default:
        return "";
    }
  };

  return (
    <Card data-testid={`card-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-bold" data-testid={`text-metric-value-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
