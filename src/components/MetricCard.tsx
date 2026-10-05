import React from 'react';
import type { MetricData } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { StatusBadge } from './StatusBadge';

interface MetricCardProps {
  data: MetricData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const getBadgeVariant = (status: MetricData['status']) => {
    switch (status) {
      case 'ready':
        return 'emerald';
      case 'active':
        return 'cyan';
      case 'warning':
        return 'amber';
      case 'critical':
        return 'amber';
      default:
        return 'dark';
    }
  };

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{data.label}</span>
        <div className="metric-icon-box">
          <DynamicIcon name={data.iconName} size={16} />
        </div>
      </div>

      <div className="metric-value-row">
        <span className="metric-value">{data.value}</span>
        {data.unit && <span className="metric-unit">{data.unit}</span>}
      </div>

      <div className="metric-footer">
        {data.change && (
          <StatusBadge
            label={data.change}
            variant={getBadgeVariant(data.status)}
            pulse={data.status === 'ready' || data.status === 'active'}
          />
        )}
        <span className="metric-desc" title={data.description}>
          {data.description.length > 32
            ? `${data.description.slice(0, 32)}...`
            : data.description}
        </span>
      </div>
    </div>
  );
};
