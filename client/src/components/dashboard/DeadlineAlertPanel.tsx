import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { SkeletonCard } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { formatDate, daysUntil } from '../../utils/format';
import { STATUS_CONFIG } from '../../utils/constants';
import type { DeadlineAlert } from '../../types';

interface DeadlineAlertPanelProps {
  upcoming: DeadlineAlert[];
  overdue: DeadlineAlert[];
  loading?: boolean;
}

export function DeadlineAlertPanel({ upcoming, overdue, loading }: DeadlineAlertPanelProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deadline Alerts</CardTitle>
        </CardHeader>
        <SkeletonCard />
        <SkeletonCard className="mt-3" />
      </Card>
    );
  }

  const allAlerts = [...overdue, ...upcoming];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Deadline Alerts</CardTitle>
          {allAlerts.length > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-medium">
              {allAlerts.length}
            </span>
          )}
        </div>
      </CardHeader>

      {allAlerts.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-text-tertiary" />}
          title="No deadline alerts"
          description="All projects are on track"
        />
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {allAlerts.map((alert) => {
            const isOverdue = alert.daysRemaining < 0;
            const statusConfig = STATUS_CONFIG[alert.status];
            return (
              <div
                key={alert.projectId}
                onClick={() => navigate(`/projects/${alert.projectId}`)}
                className="flex items-center gap-3 p-3 rounded-lg border border-warm-400 hover:bg-warm-100 cursor-pointer transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isOverdue ? 'bg-red-100 text-danger' : 'bg-yellow-100 text-warning'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{alert.projectName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${isOverdue ? 'text-danger font-medium' : 'text-warning'}`}>
                      {isOverdue
                        ? `${Math.abs(alert.daysRemaining)}d overdue`
                        : `${alert.daysRemaining}d remaining`}
                    </span>
                    <span className="text-xs text-text-tertiary">Due {formatDate(alert.endDate)}</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={alert.progress} size="sm" />
                  </div>
                </div>
                {statusConfig && (
                  <Badge variant="status" status={alert.status}>
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
