import MetricCard from '../MetricCard';
import { Activity, TrendingUp, Clock, Zap } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <MetricCard
        label="Total Deployments"
        value="142"
        trend="up"
        trendValue="+12% from last month"
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <MetricCard
        label="Success Rate"
        value="98.5%"
        trend="up"
        trendValue="+2.1%"
        icon={<Activity className="w-4 h-4" />}
      />
      <MetricCard
        label="Avg Deploy Time"
        value="4.2m"
        trend="down"
        trendValue="-0.8m"
        icon={<Clock className="w-4 h-4" />}
      />
      <MetricCard
        label="Uptime"
        value="99.98%"
        trend="stable"
        trendValue="No change"
        icon={<Zap className="w-4 h-4" />}
      />
    </div>
  );
}
