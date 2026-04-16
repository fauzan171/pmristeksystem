import { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Bell,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useWAStatus } from '../hooks/useWhatsApp';
import { notificationsApi as notifApi } from '../api/notifications.api';
import { formatRelative } from '../utils/format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationType, NotificationTrigger, NotificationStatus, Notification, PaginationParams } from '../types';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'deadline_reminder', label: 'Deadline' },
  { value: 'overdue_reminder', label: 'Overdue' },
  { value: 'progress_update', label: 'Progress' },
  { value: 'status_update', label: 'Status' },
  { value: 'wa_message', label: 'WA Message' },
];

const TRIGGER_OPTIONS = [
  { value: '', label: 'All Triggers' },
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

const TYPE_BADGE_COLORS: Record<string, string> = {
  deadline_reminder: 'bg-blue-100 text-blue-700 border-blue-200',
  overdue_reminder: 'bg-red-100 text-red-700 border-red-200',
  progress_update: 'bg-green-100 text-green-700 border-green-200',
  status_update: 'bg-purple-100 text-purple-700 border-purple-200',
  wa_message: 'bg-teal-100 text-teal-700 border-teal-200',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  deadline_reminder: <Calendar className="w-4 h-4 text-blue-500" />,
  overdue_reminder: <AlertTriangle className="w-4 h-4 text-red-500" />,
  progress_update: <TrendingUp className="w-4 h-4 text-green-500" />,
  status_update: <RefreshCw className="w-4 h-4 text-purple-500" />,
  wa_message: <Send className="w-4 h-4 text-teal-500" />,
};

const STATUS_BADGE: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="w-4 h-4 text-warning" />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  sent: { icon: <CheckCircle className="w-4 h-4 text-success" />, color: 'bg-green-100 text-green-700 border-green-200' },
  failed: { icon: <XCircle className="w-4 h-4 text-danger" />, color: 'bg-red-100 text-red-700 border-red-200' },
};

function formatTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { data: waStatus } = useWAStatus();

  const [typeFilter, setTypeFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page, typeFilter, triggerFilter, statusFilter],
    queryFn: () =>
      notifApi.getAll({
        page,
        limit: 20,
        search: typeFilter || undefined,
        status: statusFilter || undefined,
      } as PaginationParams),
  });

  const retryMutation = useMutation({
    mutationFn: (notificationId: string) => notifApi.retry(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      addToast({ type: 'success', title: 'Notification retry initiated' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Failed to retry notification' });
    },
  });

  const notifications = data?.data || [];
  const totalPages = data?.totalPages ?? 1;

  const clearFilters = () => {
    setTypeFilter('');
    setTriggerFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = typeFilter || triggerFilter || statusFilter;

  return (
    <div className="space-y-6">
      {/* WA Connection Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {waStatus?.connected ? (
              <>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">WhatsApp Connected</p>
                  <p className="text-xs text-text-secondary">{waStatus.phoneNumber || 'Connected'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">WhatsApp Disconnected</p>
                  <p className="text-xs text-text-secondary">Connect WA to send notifications</p>
                </div>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['wa-status'] })}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={TYPE_OPTIONS}
            />
            <Select
              value={triggerFilter}
              onChange={(e) => { setTriggerFilter(e.target.value); setPage(1); }}
              options={TRIGGER_OPTIONS}
            />
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={STATUS_OPTIONS}
            />
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </Card>

      {/* Notification List */}
      {isLoading ? (
        <SkeletonList count={8} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-text-tertiary" />}
          title="No notifications found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters to see more results'
              : 'Notifications will appear here when they are sent'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: Notification) => {
            const statusInfo = STATUS_BADGE[notification.status] || STATUS_BADGE.pending;
            const typeIcon = TYPE_ICONS[notification.type] || <Bell className="w-4 h-4 text-text-tertiary" />;
            const typeBadgeColor = TYPE_BADGE_COLORS[notification.type] || 'bg-warm-200 text-text-secondary border-warm-400';
            const isFailed = notification.status === 'failed';

            return (
              <Card
                key={notification.id}
                className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 ${isFailed ? 'border-red-300 bg-red-50/30' : ''}`}
              >
                {/* Type Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {typeIcon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">
                          {notification.projectName}
                        </span>
                        {notification.recipient && (
                          <span className="text-xs text-text-tertiary">
                            to {notification.recipient}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {/* Status Badge + Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {notification.status}
                      </span>
                      {isFailed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryMutation.mutate(notification.id)}
                          loading={retryMutation.isPending}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {/* Type Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeBadgeColor}`}
                    >
                      {formatTypeLabel(notification.type)}
                    </span>

                    {/* Trigger */}
                    {notification.trigger && (
                      <span className="text-[11px] text-text-tertiary capitalize">
                        {notification.trigger}
                      </span>
                    )}

                    {/* Channel */}
                    <span className="text-[11px] text-text-tertiary">
                      {notification.channel}
                    </span>

                    {/* Timestamp */}
                    <span className="text-[11px] text-text-tertiary">
                      {formatRelative(notification.createdAt)}
                    </span>
                  </div>

                  {/* Error Message for Failed */}
                  {isFailed && notification.errorMessage && (
                    <div className="mt-2 p-2 rounded-md bg-red-100 border border-red-200 text-xs text-red-700">
                      {notification.errorMessage}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
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
