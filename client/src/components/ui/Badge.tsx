import { STATUS_CONFIG } from '../../utils/constants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'status' | 'outline';
  status?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', status, className = '' }: BadgeProps) {
  if (variant === 'status' && status) {
    const config = STATUS_CONFIG[status];
    if (config) {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}
        >
          {children}
        </span>
      );
    }
  }

  if (variant === 'outline') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-warm-400 text-text-secondary ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-coral-light text-coral ${className}`}
    >
      {children}
    </span>
  );
}
