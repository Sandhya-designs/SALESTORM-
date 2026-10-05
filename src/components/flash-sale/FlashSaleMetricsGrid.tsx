import React from 'react';
import type { FlashSaleMetrics } from '../../types';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Timer,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

interface FlashSaleMetricsGridProps {
  metrics: FlashSaleMetrics;
}

export const FlashSaleMetricsGrid: React.FC<FlashSaleMetricsGridProps> = ({ metrics }) => {
  const cards = [
    {
      id: 'requests',
      label: 'Requests Received',
      value: metrics.requestsReceived.toLocaleString(),
      sub: 'Target: 10,000 req',
      icon: <TrendingUp size={16} />,
      color: 'cyan',
    },
    {
      id: 'successful-res',
      label: 'Successful Reservations',
      value: metrics.successfulReservations,
      sub: 'Max cap: 100',
      icon: <CheckCircle2 size={16} />,
      color: 'emerald',
    },
    {
      id: 'failed-res',
      label: 'Failed Reservations',
      value: metrics.failedReservations.toLocaleString(),
      sub: 'Rate limited / Sold out',
      icon: <XCircle size={16} />,
      color: metrics.failedReservations > 0 ? 'amber' : 'muted',
    },
    {
      id: 'available-stock',
      label: 'Available Stock',
      value: metrics.availableStock,
      sub: metrics.availableStock === 0 ? 'EXHAUSTED' : 'Units remaining',
      icon: <PackageCheck size={16} />,
      color: metrics.availableStock > 0 ? 'emerald' : 'muted',
    },
    {
      id: 'active-res',
      label: 'Active Reservations',
      value: metrics.activeReservations,
      sub: 'Locked in holding TTL',
      icon: <Timer size={16} />,
      color: 'cyan',
    },
    {
      id: 'payments-pending',
      label: 'Payments Pending',
      value: metrics.paymentsPending,
      sub: 'In authorization pipe',
      icon: <CreditCard size={16} />,
      color: 'purple',
    },
    {
      id: 'orders-confirmed',
      label: 'Orders Confirmed',
      value: metrics.ordersConfirmed,
      sub: 'Finalized commitments',
      icon: <ShoppingBag size={16} />,
      color: 'emerald',
    },
  ];

  return (
    <div className="metrics-seven-grid">
      {cards.map((card) => (
        <div key={card.id} className={`live-metric-card border-accent-${card.color}`}>
          <div className="live-metric-top">
            <span className="live-metric-label">{card.label}</span>
            <div className={`live-metric-icon icon-${card.color}`}>{card.icon}</div>
          </div>
          <div className="live-metric-val font-mono">{card.value}</div>
          <div className="live-metric-sub">{card.sub}</div>
        </div>
      ))}
    </div>
  );
};
