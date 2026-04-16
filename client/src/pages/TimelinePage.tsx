import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useProjects } from '../hooks/useProjects';
import { formatDate } from '../utils/format';
import { STATUS_CONFIG } from '../utils/constants';
import { addDays, startOfWeek, addWeeks, subWeeks, startOfMonth, addMonths, subMonths, format, differenceInDays, parseISO, isWithinInterval } from 'date-fns';

type ViewMode = 'week' | 'month' | 'all';

export function TimelinePage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, isLoading } = useProjects({ limit: 100 });

  const projects = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((p) => p.status !== 'completed');
  }, [data]);

  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end: addDays(start, 6) };
    } else if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      return { start, end: addDays(addMonths(start, 1), -1) };
    }
    // All: find min start / max end
    if (projects.length === 0) {
      return { start: startOfMonth(currentDate), end: addDays(startOfMonth(currentDate), 30) };
    }
    const starts = projects.map((p) => parseISO(p.startDate));
    const ends = projects.map((p) => parseISO(p.endDate));
    return {
      start: new Date(Math.min(...starts.map((d) => d.getTime()))),
      end: new Date(Math.max(...ends.map((d) => d.getTime()))),
    };
  }, [viewMode, currentDate, projects]);

  const totalDays = Math.max(differenceInDays(dateRange.end, dateRange.start) + 1, 1);

  const navigatePrev = () => {
    if (viewMode === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else if (viewMode === 'month') setCurrentDate((d) => subMonths(d, 1));
  };

  const navigateNext = () => {
    if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else if (viewMode === 'month') setCurrentDate((d) => addMonths(d, 1));
  };

  const navigateToday = () => setCurrentDate(new Date());

  const todayOffset = differenceInDays(new Date(), dateRange.start);

  // Generate month markers
  const monthMarkers = useMemo(() => {
    const markers: { label: string; offset: number }[] = [];
    let d = new Date(dateRange.start);
    while (d <= dateRange.end) {
      const offset = differenceInDays(d, dateRange.start);
      markers.push({ label: format(d, 'MMM yyyy'), offset });
      d = addMonths(d, 1);
    }
    return markers;
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['week', 'month', 'all'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-coral text-white'
                  : 'bg-white border border-warm-400 text-text-secondary hover:bg-warm-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {viewMode !== 'all' && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={navigatePrev}>{''}</Button>
            <span className="text-sm font-medium text-text-primary min-w-[160px] text-center">
              {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
            </span>
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={navigateNext}>{''}</Button>
            <Button variant="outline" size="sm" onClick={navigateToday}>Today</Button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <Card padding={false}>
        {projects.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-text-tertiary" />}
              title="No projects to display"
              description="Create projects with start and end dates to see them on the timeline"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Header with date markers */}
            <div className="flex border-b border-warm-400">
              <div className="w-[120px] sm:w-[200px] flex-shrink-0 p-3 text-xs font-medium text-text-secondary border-r border-warm-400">
                Project
              </div>
              <div className="flex-1 relative p-3">
                <div className="flex justify-between text-xs text-text-tertiary">
                  {monthMarkers.map((m, i) => (
                    <span key={i} style={{ position: 'absolute', left: `${(m.offset / totalDays) * 100}%` }}>
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Rows */}
            {projects.map((project) => {
              const startDate = parseISO(project.startDate);
              const endDate = parseISO(project.endDate);
              const startOffset = differenceInDays(startDate, dateRange.start);
              const duration = differenceInDays(endDate, startDate) + 1;

              const leftPercent = Math.max((startOffset / totalDays) * 100, 0);
              const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);

              const statusConf = STATUS_CONFIG[project.status];
              const barColor =
                project.status === 'ongoing' ? 'bg-status-ongoing-text' :
                project.status === 'on-hold' ? 'bg-status-onhold-text' :
                'bg-status-planning-text';

              return (
                <div
                  key={project.id}
                  className="flex border-b border-warm-400 hover:bg-warm-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="w-[120px] sm:w-[200px] flex-shrink-0 p-3 border-r border-warm-400">
                    <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {statusConf && (
                        <Badge variant="status" status={project.status}>
                          {statusConf.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative p-3 min-h-[52px]">
                    <div className="relative w-full h-full">
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${barColor} opacity-80 flex items-center px-2`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 1)}%`,
                        }}
                      >
                        {widthPercent > 5 && (
                          <span className="text-[10px] text-white font-medium truncate">
                            {project.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Today indicator */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-coral z-10 pointer-events-none"
                style={{ left: `calc(200px + ${(todayOffset / totalDays) * 100}% * (1 - 200px / totalDays))` }}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
