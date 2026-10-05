import React from 'react';
import type { Reservation } from '../../types';
import { Clock, CheckCircle2, RotateCcw, AlertTriangle, ListFilter } from 'lucide-react';

interface ReservationSummaryCardsProps {
  reservations: Reservation[];
  currentFilter: string;
  onFilterChange: (status: string) => void;
}

export const ReservationSummaryCards: React.FC<ReservationSummaryCardsProps> = ({
  reservations,
  currentFilter,
  onFilterChange,
}) => {
  const activeCount = reservations.filter(
    (r) => r.status === 'RESERVED' || r.status === 'PAYMENT_PENDING'
  ).length;
  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length;
  const expiredCount = reservations.filter((r) => r.status === 'EXPIRED').length;
  const releasedCount = reservations.filter((r) => r.status === 'RELEASED').length;
  const totalCount = reservations.length;

  const categories = [
    {
      id: 'ALL',
      label: 'All Reservations',
      count: totalCount,
      icon: <ListFilter size={18} />,
      color: 'cyan',
    },
    {
      id: 'RESERVED',
      label: 'Active Reservations',
      count: activeCount,
      icon: <Clock size={18} />,
      color: 'cyan',
    },
    {
      id: 'CONFIRMED',
      label: 'Confirmed Purchases',
      count: confirmedCount,
      icon: <CheckCircle2 size={18} />,
      color: 'emerald',
    },
    {
      id: 'RELEASED',
      label: 'Released Locks',
      count: releasedCount,
      icon: <RotateCcw size={18} />,
      color: 'muted',
    },
    {
      id: 'EXPIRED',
      label: 'Expired (TTL)',
      count: expiredCount,
      icon: <AlertTriangle size={18} />,
      color: 'amber',
    },
  ];

  return (
    <div className="res-cards-grid">
      {categories.map((cat) => {
        const isSelected = currentFilter === cat.id;
        return (
          <div
            key={cat.id}
            className={`res-summary-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onFilterChange(cat.id)}
          >
            <div className="res-card-top">
              <span className="res-card-label">{cat.label}</span>
              <div className={`metric-icon-box icon-${cat.color}`}>{cat.icon}</div>
            </div>
            <div className="res-card-val font-mono">{cat.count}</div>
            <div className="res-card-footer">
              <span className="res-card-filter-action">
                {isSelected ? '● Filtering active' : 'Click to filter'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
