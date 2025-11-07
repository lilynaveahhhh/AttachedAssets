import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, RefreshCw } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  onRefresh?: () => void;
  onDownload?: () => void;
}

export default function LogViewer({ logs, onRefresh, onDownload }: LogViewerProps) {
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive" className="text-xs font-mono">ERROR</Badge>;
      case "warn":
        return <Badge className="bg-chart-4 text-white text-xs font-mono">WARN</Badge>;
      case "info":
        return <Badge className="bg-chart-1 text-white text-xs font-mono">INFO</Badge>;
      case "debug":
        return <Badge variant="secondary" className="text-xs font-mono">DEBUG</Badge>;
    }
  };

  return (
    <Card data-testid="card-log-viewer">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Deployment Logs</CardTitle>
        <div className="flex gap-2">
          {onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh} data-testid="button-refresh-logs">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          {onDownload && (
            <Button size="sm" variant="outline" onClick={onDownload} data-testid="button-download-logs">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/30">
          <div className="space-y-2 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-3" data-testid={`log-entry-${index}`}>
                <span className="text-muted-foreground text-xs">{log.timestamp}</span>
                {getLevelBadge(log.level)}
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
