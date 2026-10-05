import React from 'react';
import type { SimulationStats } from '../../types';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Package,
  ShieldCheck,
  CopyX,
} from 'lucide-react';

interface SimulationResultsGridProps {
  stats: SimulationStats;
}

export const SimulationResultsGrid: React.FC<SimulationResultsGridProps> = ({ stats }) => {
  const cards = [
    {
      id: 'requests',
      label: 'Requests',
      value: stats.requestsProcessed.toLocaleString(),
      target: `Target: ${stats.totalRequests.toLocaleString()}`,
      icon: <TrendingUp size={16} />,
      color: 'cyan',
    },
    {
      id: 'successful',
      label: 'Successful Reservations',
      value: stats.successfulReservations,
      target: 'Strict Cap: 100 units',
      icon: <CheckCircle2 size={16} />,
      color: 'emerald',
    },
    {
      id: 'failed',
      label: 'Failed',
      value: stats.failedReservations.toLocaleString(),
      target: 'Stock Exhausted / Shed',
      icon: <XCircle size={16} />,
      color: stats.failedReservations > 0 ? 'amber' : 'muted',
    },
    {
      id: 'remaining',
      label: 'Remaining Inventory',
      value: stats.remainingInventory,
      target: stats.remainingInventory === 0 ? 'Exhausted (Zero-oversell)' : 'Available units',
      icon: <Package size={16} />,
      color: stats.remainingInventory > 0 ? 'emerald' : 'muted',
    },
    {
      id: 'oversold',
      label: 'Oversold',
      value: stats.oversold,
      target: 'Invariant: Exactly 0',
      icon: <ShieldCheck size={16} />,
      color: stats.oversold === 0 ? 'emerald' : 'danger',
    },
    {
      id: 'duplicates',
      label: 'Duplicate Reservations',
      value: stats.duplicateReservations,
      target: 'Idempotency Deduped',
      icon: <CopyX size={16} />,
      color: 'cyan',
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {cards.map((c) => (
          <div key={c.id} className="live-metric-card">
            <div className="live-metric-top">
              <span className="live-metric-label">{c.label}</span>
              <div className={`live-metric-icon icon-${c.color}`}>{c.icon}</div>
            </div>
            <div className="live-metric-val font-mono">{c.value}</div>
            <div className="live-metric-sub">{c.target}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
