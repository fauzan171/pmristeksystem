import React from 'react';
import { Skeleton } from '../ui/Skeleton';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
  loading?: boolean;
}

export function StatCard({ icon, value, label, color = 'bg-coral-light text-coral', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-warm-400 p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-warm-400 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-sm text-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}
