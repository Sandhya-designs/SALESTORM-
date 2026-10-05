import React from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface PaymentSummaryCardsProps {
  stats: {
    total: number;
    successful: number;
    failed: number;
    timeouts: number;
    pending: number;
  };
}

export const PaymentSummaryCards: React.FC<PaymentSummaryCardsProps> = ({ stats }) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Payments',
      value: stats.total,
      sub: 'Simulated authorizations',
      icon: <CreditCard size={18} />,
      color: 'cyan',
    },
    {
      id: 'successful',
      label: 'Successful',
      value: stats.successful,
      sub: 'Captured & confirmed',
      icon: <CheckCircle2 size={18} />,
      color: 'emerald',
    },
    {
      id: 'failed',
      label: 'Failed',
      value: stats.failed,
      sub: 'Card declines / released locks',
      icon: <XCircle size={18} />,
      color: stats.failed > 0 ? 'amber' : 'muted',
    },
    {
      id: 'timeouts',
      label: 'Timeouts',
      value: stats.timeouts,
      sub: 'Reconciliation required',
      icon: <AlertTriangle size={18} />,
      color: stats.timeouts > 0 ? 'amber' : 'muted',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: stats.pending,
      sub: 'In gateway flight',
      icon: <Clock size={18} />,
      color: 'purple',
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {cards.map((c) => (
          <div key={c.id} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{c.label}</span>
              <div className={`metric-icon-box icon-${c.color}`}>{c.icon}</div>
            </div>
            <div className="metric-value-row">
              <span className="metric-value font-mono">{c.value}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-desc">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
