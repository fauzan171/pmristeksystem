import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { STATUS_CONFIG } from '../../utils/constants';
import { SkeletonCard } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import type { StatusDistribution } from '../../types';

const COLORS: Record<string, string> = {
  planning: '#F57F17',
  ongoing: '#1565C0',
  'on-hold': '#616161',
  completed: '#2E7D32',
};

interface StatusDistributionChartProps {
  data: StatusDistribution[];
  loading?: boolean;
}

export function StatusDistributionChart({ data, loading }: StatusDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <SkeletonCard />
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: STATUS_CONFIG[d.status]?.label || d.status,
    value: d.count,
    status: d.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>

      {chartData.length === 0 ? (
        <EmptyState title="No projects yet" description="Create your first project to see distribution" />
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-[160px] h-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.status] || '#9B9590'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} projects`, '']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E8E3DD',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {chartData.map((item) => {
              const config = STATUS_CONFIG[item.status];
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[item.status] }}
                    />
                    <span className="text-sm text-text-primary">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-text-secondary">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
