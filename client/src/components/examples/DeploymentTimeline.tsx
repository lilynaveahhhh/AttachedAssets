import DeploymentTimeline from '../DeploymentTimeline';

export default function DeploymentTimelineExample() {
  const mockItems = [
    {
      id: "1",
      version: "v2.5.0",
      environment: "green" as const,
      commitHash: "d9e1c4a",
      commitMessage: "Add new dashboard features",
      status: "in-progress" as const,
      timestamp: "5 minutes ago",
    },
    {
      id: "2",
      version: "v2.4.1",
      environment: "blue" as const,
      commitHash: "a3f7b2c",
      commitMessage: "Fix authentication bug",
      status: "success" as const,
      timestamp: "2 hours ago",
      duration: "3m 42s",
    },
    {
      id: "3",
      version: "v2.4.0",
      environment: "green" as const,
      commitHash: "7c8d2e1",
      commitMessage: "Performance improvements",
      status: "success" as const,
      timestamp: "1 day ago",
      duration: "4m 12s",
    },
    {
      id: "4",
      version: "v2.3.9",
      environment: "blue" as const,
      commitHash: "b5f9a3d",
      commitMessage: "Update dependencies",
      status: "failed" as const,
      timestamp: "2 days ago",
      duration: "1m 23s",
    },
  ];

  return (
    <div className="p-4 max-w-3xl">
      <DeploymentTimeline
        items={mockItems}
        onRollback={(id) => console.log('Rollback to deployment', id)}
      />
    </div>
  );
}
