import LogViewer from '../LogViewer';

export default function LogViewerExample() {
  const mockLogs = [
    { timestamp: "14:23:45", level: "info" as const, message: "Starting deployment to green environment" },
    { timestamp: "14:23:46", level: "info" as const, message: "Building application artifacts..." },
    { timestamp: "14:23:52", level: "info" as const, message: "Artifact build completed successfully" },
    { timestamp: "14:23:53", level: "info" as const, message: "Uploading to S3 bucket..." },
    { timestamp: "14:24:01", level: "info" as const, message: "Creating application version v2.5.0" },
    { timestamp: "14:24:05", level: "warn" as const, message: "Environment capacity at 80%" },
    { timestamp: "14:24:12", level: "info" as const, message: "Deploying to Elastic Beanstalk..." },
    { timestamp: "14:24:45", level: "info" as const, message: "Health check initiated" },
    { timestamp: "14:24:47", level: "info" as const, message: "All health checks passed" },
    { timestamp: "14:24:48", level: "info" as const, message: "Deployment completed successfully" },
  ];

  return (
    <div className="p-4 max-w-4xl">
      <LogViewer
        logs={mockLogs}
        onRefresh={() => console.log('Refresh logs')}
        onDownload={() => console.log('Download logs')}
      />
    </div>
  );
}
