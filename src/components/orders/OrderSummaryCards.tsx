import React from 'react';
import type { OrderRecord } from '../../types';
import { ShoppingBag, CheckCircle2, Truck, PackageCheck, XCircle } from 'lucide-react';

interface OrderSummaryCardsProps {
  orders: OrderRecord[];
}

export const OrderSummaryCards: React.FC<OrderSummaryCardsProps> = ({ orders }) => {
  const total = orders.length;
  const confirmed = orders.filter((o) => o.orderStatus === 'CONFIRMED').length;
  const inFulfillment = orders.filter(
    (o) =>
      o.orderStatus === 'PROCESSING' ||
      o.orderStatus === 'SHIPPED' ||
      o.orderStatus === 'OUT_FOR_DELIVERY'
  ).length;
  const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelled = orders.filter((o) => o.orderStatus === 'CANCELLED').length;

  const cards = [
    {
      id: 'total',
      label: 'Total Orders',
      value: total,
      sub: 'Committed order records',
      icon: <ShoppingBag size={18} />,
      color: 'cyan',
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      value: confirmed,
      sub: 'Awaiting warehouse pick',
      icon: <CheckCircle2 size={18} />,
      color: 'purple',
    },
    {
      id: 'fulfillment',
      label: 'In Fulfillment',
      value: inFulfillment,
      sub: 'Processing, Shipped, Out',
      icon: <Truck size={18} />,
      color: 'amber',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      value: delivered,
      sub: 'Doorstep signed & settled',
      icon: <PackageCheck size={18} />,
      color: 'emerald',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      value: cancelled,
      sub: 'Aborted / voided',
      icon: <XCircle size={18} />,
      color: cancelled > 0 ? 'amber' : 'muted',
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
