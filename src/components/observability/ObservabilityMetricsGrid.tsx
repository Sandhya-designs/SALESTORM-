import React from 'react';
import type { ObservabilityMetrics } from '../../types';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Zap,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface ObservabilityMetricsGridProps {
  metrics: ObservabilityMetrics;
}

export const ObservabilityMetricsGrid: React.FC<ObservabilityMetricsGridProps> = ({ metrics }) => {
  const cards = [
    {
      id: 'req_sec',
      label: 'Requests/sec',
      value: metrics.requestsPerSec.toLocaleString(),
      sub: 'Peak admission throughput',
      icon: <Zap size={16} />,
      color: 'cyan',
    },
    {
      id: 'res_success',
      label: 'Successful Reservations',
      value: metrics.successfulReservations,
      sub: 'Max ceiling: 100 units',
      icon: <CheckCircle2 size={16} />,
      color: 'emerald',
    },
    {
      id: 'res_failed',
      label: 'Failed Reservations',
      value: metrics.failedReservations.toLocaleString(),
      sub: 'Protected by invariant guard',
      icon: <XCircle size={16} />,
      color: metrics.failedReservations > 0 ? 'rose' : 'muted',
    },
    {
      id: 'curr_inventory',
      label: 'Current Inventory',
      value: `${metrics.currentAvailableInventory} / 100`,
      sub: `Avail: ${metrics.currentAvailableInventory} • Res: ${metrics.currentReservedInventory} • Sold: ${metrics.currentSoldInventory}`,
      icon: <Package size={16} />,
      color: metrics.currentAvailableInventory > 0 ? 'cyan' : 'amber',
    },
    {
      id: 'expiry_rate',
      label: 'Reservation Expiry Rate',
      value: `${metrics.reservationExpiryRate}%`,
      sub: 'Reclaimed by TTL sweeper',
      icon: <Clock size={16} />,
      color: 'amber',
    },
    {
      id: 'pay_success',
      label: 'Payment Success Rate',
      value: `${metrics.paymentSuccessRate}%`,
      sub: 'Simulated gateway capture',
      icon: <CreditCard size={16} />,
      color: 'emerald',
    },
    {
      id: 'pay_failure',
      label: 'Payment Failure Rate',
      value: `${metrics.paymentFailureRate}%`,
      sub: 'Simulated card declines',
      icon: <AlertTriangle size={16} />,
      color: metrics.paymentFailureRate > 0 ? 'rose' : 'muted',
    },
    {
      id: 'conv_rate',
      label: 'Order Conversion Rate',
      value: `${metrics.orderConversionRate}%`,
      sub: 'Reserved to Order conversion',
      icon: <TrendingUp size={16} />,
      color: 'purple',
    },
    {
      id: 'avg_time',
      label: 'Avg Processing Time',
      value: `${metrics.avgProcessingTimeMs} ms`,
      sub: 'CAS atomic state mutation',
      icon: <Activity size={16} />,
      color: 'cyan',
    },
    {
      id: 'p95_lat',
      label: 'P95 Latency',
      value: `${metrics.p95LatencyMs} ms`,
      sub: 'End-to-end checkout saga',
      icon: <Cpu size={16} />,
      color: 'cyan',
    },
    {
      id: 'queue_backlog',
      label: 'Queue Backlog',
      value: metrics.queueBacklog,
      sub: 'Pending message buffer',
      icon: <Layers size={16} />,
      color: 'muted',
    },
    {
      id: 'system_errors',
      label: 'System Errors',
      value: metrics.systemErrors,
      sub: 'Recovered fault events',
      icon: <AlertTriangle size={16} />,
      color: metrics.systemErrors > 0 ? 'amber' : 'emerald',
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Local Simulation Metrics Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={15} className="text-cyan" />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            LOCAL SIMULATION METRICS (CORE TELEMETRY GAUGES)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} className="text-emerald" />
          <span className="font-mono text-emerald" style={{ fontSize: '0.74rem', fontWeight: 800 }}>
            OVERSOLD: {metrics.oversold} (SAFETY INVARIANT VALID)
          </span>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {cards.map((c) => (
          <div key={c.id} className="metric-card" style={{ padding: '14px 16px' }}>
            <div className="metric-header" style={{ marginBottom: '6px' }}>
              <span className="metric-label" style={{ fontSize: '0.68rem' }}>{c.label}</span>
              <div className={`metric-icon-box icon-${c.color}`} style={{ width: '28px', height: '28px' }}>
                {c.icon}
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-value font-mono" style={{ fontSize: '1.45rem' }}>{c.value}</span>
            </div>
            <div className="metric-footer" style={{ marginTop: '4px' }}>
              <span className="metric-desc" style={{ fontSize: '0.68rem' }}>{c.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
