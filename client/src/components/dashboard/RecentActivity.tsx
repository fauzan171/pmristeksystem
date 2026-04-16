import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { SkeletonList } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { formatRelative } from '../../utils/format';
import { ACTION_CONFIG } from '../../utils/constants';
import {
  FolderPlus,
  Edit3,
  RefreshCw,
  BarChart3,
  StickyNote,
  Trash2,
  MessageSquare,
  Unplug,
  Bell,
  LogIn,
} from 'lucide-react';
import type { ActivityLog, ActionType } from '../../types';

const actionIcons: Record<ActionType, React.ReactNode> = {
  project_created: <FolderPlus className="w-4 h-4" />,
  project_updated: <Edit3 className="w-4 h-4" />,
  project_status_changed: <RefreshCw className="w-4 h-4" />,
  project_progress_updated: <BarChart3 className="w-4 h-4" />,
  note_added: <StickyNote className="w-4 h-4" />,
  note_updated: <Edit3 className="w-4 h-4" />,
  note_deleted: <Trash2 className="w-4 h-4" />,
  wa_connected: <MessageSquare className="w-4 h-4" />,
  wa_disconnected: <Unplug className="w-4 h-4" />,
  wa_message_sent: <MessageSquare className="w-4 h-4" />,
  notification_sent: <Bell className="w-4 h-4" />,
  user_login: <LogIn className="w-4 h-4" />,
};

interface RecentActivityProps {
  activities: ActivityLog[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <SkeletonList count={5} />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <button
          onClick={() => navigate('/activity')}
          className="text-xs font-medium text-coral hover:text-coral-hover transition-colors"
        >
          View all
        </button>
      </CardHeader>

      {activities.length === 0 ? (
        <EmptyState title="No recent activity" description="Activity will appear here as you use the system" />
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => {
            const config = ACTION_CONFIG[activity.action];
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-warm-100 ${config?.color || 'text-text-secondary'}`}
                >
                  {actionIcons[activity.action]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    <span className="text-text-secondary">{activity.details}</span>
                  </p>
                  {activity.projectName && (
                    <button
                      onClick={() => navigate(`/projects/${activity.projectId}`)}
                      className="text-xs text-coral hover:text-coral-hover transition-colors"
                    >
                      {activity.projectName}
                    </button>
                  )}
                  <p className="text-xs text-text-tertiary mt-0.5">{formatRelative(activity.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
