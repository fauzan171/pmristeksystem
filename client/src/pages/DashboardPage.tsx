import {
  FolderKanban,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/dashboard/StatCard';
import { DeadlineAlertPanel } from '../components/dashboard/DeadlineAlertPanel';
import { StatusDistributionChart } from '../components/dashboard/StatusDistribution';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickActions } from '../components/dashboard/QuickActions';

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const stats = data?.stats;
  const upcoming = data?.upcomingDeadlines || [];
  const overdue = data?.overdueProjects || [];
  const distribution = data?.statusDistribution || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="w-5 h-5" />}
          value={stats?.totalProjects ?? 0}
          label="Total Projects"
          color="bg-coral-light text-coral"
          loading={isLoading}
        />
        <StatCard
          icon={<Play className="w-5 h-5" />}
          value={stats?.activeProjects ?? 0}
          label="Active Projects"
          color="bg-status-ongoing-bg text-status-ongoing-text"
          loading={isLoading}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          value={stats?.completedProjects ?? 0}
          label="Completed"
          color="bg-status-completed-bg text-status-completed-text"
          loading={isLoading}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={stats?.overdueProjects ?? 0}
          label="Overdue"
          color="bg-red-100 text-danger"
          loading={isLoading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadline Alerts */}
        <DeadlineAlertPanel upcoming={upcoming} overdue={overdue} loading={isLoading} />

        {/* Status Distribution */}
        <StatusDistributionChart data={distribution} loading={isLoading} />
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivity activities={recentActivity} loading={isLoading} />
    </div>
  );
}
