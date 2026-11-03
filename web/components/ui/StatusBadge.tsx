import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label }) => {
  return <span className={`badge badge-${variant}`}>{label}</span>;
};

