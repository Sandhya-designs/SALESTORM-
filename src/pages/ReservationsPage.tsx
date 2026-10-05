import React, { useState } from 'react';
import { useInventoryStore } from '../../src/hooks/useInventoryStore';
import { ReservationSummaryCards } from '../components/reservations/ReservationSummaryCards';
import { ReservationTable } from '../components/reservations/ReservationTable';
import { StatusBadge } from '../components/StatusBadge';
import { Timer, Key, ShieldCheck } from 'lucide-react';

export const ReservationsPage: React.FC = () => {
  const {
    reservations,
    releaseReservation,
    confirmReservation,
    expireReservation,
  } = useInventoryStore();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const activeReservationsCount = reservations.filter(
    (r) => r.status === 'RESERVED' || r.status === 'PAYMENT_PENDING'
  ).length;

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Reservation Manager &amp; TTL Locks
            </h1>
            <StatusBadge
              label={`${activeReservationsCount} ACTIVE LOCKS`}
              variant="cyan"
              pulse={activeReservationsCount > 0}
            />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Timer size={14} className="text-cyan" />
            <span>Short-lived reservation locks with automatic TTL expiration, idempotent deduplication, and state lifecycle transitions.</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge
            label="IDEMPOTENCY ACTIVE"
            variant="dark"
            icon={<Key size={13} className="text-cyan" />}
          />
          <StatusBadge
            label="AUTO-EXPIRY 1s LOOP"
            variant="emerald"
            icon={<ShieldCheck size={13} />}
          />
        </div>
      </div>

      {/* Reservation Summary Cards (Active, Confirmed, Released, Expired, All) */}
      <ReservationSummaryCards
        reservations={reservations}
        currentFilter={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {/* Filterable Reservation Table with Actions */}
      <ReservationTable
        reservations={reservations}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        onRelease={releaseReservation}
        onConfirm={confirmReservation}
        onExpire={expireReservation}
      />
    </div>
  );
};
