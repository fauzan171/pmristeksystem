import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { useActivity } from '../hooks/useActivity';
import { useProjects } from '../hooks/useProjects';
import { formatRelative, formatDate } from '../utils/format';
import { ACTION_CONFIG } from '../utils/constants';
import type { ActionType } from '../types';
import { parseISO, format, isToday, isYesterday, isSameDay, subDays } from 'date-fns';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_updated', label: 'Project Updated' },
  { value: 'project_status_changed', label: 'Status Changed' },
  { value: 'project_progress_updated', label: 'Progress Updated' },
  { value: 'note_added', label: 'Note Added' },
  { value: 'note_deleted', label: 'Note Deleted' },
  { value: 'wa_message_sent', label: 'WA Message Sent' },
  { value: 'notification_sent', label: 'Notification Sent' },
];

function getDateGroup(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function ActivityLogPage() {
  const navigate = useNavigate();
  const [actionFilter, setActionFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: projectsData } = useProjects({ limit: 100 });
  const { data, isLoading } = useActivity(projectFilter || undefined, {
    page,
    limit: 20,
    action: actionFilter || undefined,
  });

  const activities = data?.data || [];
  const totalPages = data?.totalPages ?? 1;

  // Group activities by date
  const grouped = activities.reduce<Record<string, typeof activities>>((acc, activity) => {
    const group = getDateGroup(activity.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(activity);
    return acc;
  }, {});

  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...(projectsData?.data?.map((p) => ({ value: p.id, label: p.name })) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              options={ACTION_OPTIONS}
            />
            <Select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
              options={projectOptions}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setActionFilter(''); setProjectFilter(''); setPage(1); }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Timeline */}
      {isLoading ? (
        <SkeletonList count={10} />
      ) : activities.length === 0 ? (
        <EmptyState title="No activity found" description="Try adjusting your filters" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 sticky top-0 bg-warm-50 py-1 z-10">
                {date}
              </h3>
              <div className="space-y-2 ml-4 border-l-2 border-warm-200 pl-4">
                {items.map((activity) => {
                  const config = ACTION_CONFIG[activity.action];
                  return (
                    <div
                      key={activity.id}
                      className="relative p-3 rounded-lg bg-white border border-warm-400 hover:shadow-sm transition-shadow"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full bg-warm-300 border-2 border-white" />

                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-text-primary">
                            <span className="font-medium">{activity.userName}</span>{' '}
                            <span className="text-text-secondary">{activity.details}</span>
                          </p>
                          {activity.projectName && (
                            <button
                              onClick={() => navigate(`/projects/${activity.projectId}`)}
                              className="text-xs text-coral hover:text-coral-hover mt-1"
                            >
                              {activity.projectName}
                            </button>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className="text-xs text-text-tertiary">{formatRelative(activity.createdAt)}</span>
                          {config && (
                            <p className={`text-xs font-medium mt-0.5 ${config.color}`}>{config.label}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
