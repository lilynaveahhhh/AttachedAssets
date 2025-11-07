import HealthCheckPanel from '../HealthCheckPanel';

export default function HealthCheckPanelExample() {
  const mockChecks = [
    { endpoint: "/health", status: "passing" as const, responseTime: 45, lastCheck: "2 minutes ago" },
    { endpoint: "/api/users", status: "passing" as const, responseTime: 120, lastCheck: "2 minutes ago" },
    { endpoint: "/api/products", status: "pending" as const, responseTime: 89, lastCheck: "3 minutes ago" },
    { endpoint: "/metrics", status: "passing" as const, responseTime: 67, lastCheck: "2 minutes ago" },
  ];

  return (
    <div className="p-4 max-w-2xl">
      <HealthCheckPanel checks={mockChecks} />
    </div>
  );
}
