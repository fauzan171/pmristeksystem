import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hoverable?: boolean;
}

export function Card({ children, className = '', padding = true, hoverable = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-warm-400 shadow-sm ${padding ? 'p-6' : ''} ${hoverable ? 'card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-base font-semibold text-text-primary ${className}`}>{children}</h3>;
}
