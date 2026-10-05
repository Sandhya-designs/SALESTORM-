import React from 'react';

export type BadgeVariant = 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple' | 'dark';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'cyan',
  pulse = false,
  icon,
}) => {
  return (
    <span className={`badge badge-${variant}`}>
      {pulse && <span className="status-dot pulse-dot" />}
      {icon}
      <span>{label}</span>
    </span>
  );
};
