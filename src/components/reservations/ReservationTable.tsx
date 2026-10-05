import React, { useState } from 'react';
import type { Reservation, ReservationStatus } from '../../types';
import { Search, Filter, Check, X, AlertTriangle, Key } from 'lucide-react';

interface ReservationTableProps {
  reservations: Reservation[];
  filterStatus: string;
  onFilterChange: (status: string) => void;
  onRelease: (id: string) => void;
  onConfirm: (id: string) => void;
  onExpire: (id: string) => void;
}

export const ReservationTable: React.FC<ReservationTableProps> = ({
  reservations,
  filterStatus,
  onFilterChange,
  onRelease,
  onConfirm,
  onExpire,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterTabs: { label: string; value: string }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Active (Reserved)', value: 'RESERVED' },
    { label: 'Payment Pending', value: 'PAYMENT_PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Released', value: 'RELEASED' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Failed', value: 'FAILED' },
  ];

  const filteredReservations = reservations.filter((r) => {
    // Status filter
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'RESERVED' && r.status !== 'RESERVED' && r.status !== 'PAYMENT_PENDING') {
        return false;
      }
      if (filterStatus !== 'RESERVED' && r.status !== filterStatus) {
        return false;
      }
    }

    // Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.customerId.toLowerCase().includes(q) ||
        r.idempotencyKey.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'RESERVED':
        return <span className="sample-badge badge-cyan">RESERVED</span>;
      case 'CONFIRMED':
        return <span className="sample-badge badge-emerald">CONFIRMED</span>;
      case 'RELEASED':
        return <span className="sample-badge badge-dark">RELEASED</span>;
      case 'EXPIRED':
        return <span className="sample-badge badge-amber">EXPIRED</span>;
      case 'FAILED':
        return <span className="sample-badge badge-danger">FAILED</span>;
      case 'PAYMENT_PENDING':
      default:
        return <span className="sample-badge badge-purple">PAYMENT PENDING</span>;
    }
  };

  const getRemainingTtl = (expiresAt: number, status: ReservationStatus) => {
    if (status !== 'RESERVED') {
      return '-';
    }
    const rem = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    return rem > 0 ? `${rem}s remaining` : 'Expiring...';
  };

  return (
    <div className="traffic-table-card">
      {/* Controls header: Search & Status Pills */}
      <div className="res-table-controls">
        <div className="res-search-box">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            className="res-search-input"
            placeholder="Search by Reservation ID, Customer ID, or Idempotency Key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="btn-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="res-filter-pills">
          <Filter size={13} className="text-muted" style={{ marginRight: '4px' }} />
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`filter-pill ${filterStatus === tab.value ? 'active' : ''}`}
              onClick={() => onFilterChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-responsive">
        <table className="flash-table">
          <thead>
            <tr>
              <th>RESERVATION ID</th>
              <th>CUSTOMER ID</th>
              <th>QUANTITY</th>
              <th>STATUS</th>
              <th>CREATED AT</th>
              <th>EXPIRES AT</th>
              <th>IDEMPOTENCY KEY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No reservations found matching the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredReservations.map((res) => {
                const isActive = res.status === 'RESERVED' || res.status === 'PAYMENT_PENDING';
                return (
                  <tr key={res.id}>
                    <td className="font-mono text-cyan font-bold">{res.id}</td>
                    <td className="font-mono">{res.customerId}</td>
                    <td className="font-mono font-bold" style={{ color: '#ffffff' }}>
                      {res.quantity}
                    </td>
                    <td>{getStatusBadge(res.status)}</td>
                    <td className="font-mono text-muted">
                      {new Date(res.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="font-mono text-amber">
                      {new Date(res.expiresAt).toLocaleTimeString()}{' '}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        ({getRemainingTtl(res.expiresAt, res.status)})
                      </span>
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Key size={11} className="text-cyan" />
                        {res.idempotencyKey}
                      </span>
                    </td>
                    <td>
                      {isActive ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-action btn-action-confirm"
                            onClick={() => onConfirm(res.id)}
                            title="Confirm reservation (commitment to order)"
                          >
                            <Check size={12} /> Confirm
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-release"
                            onClick={() => onRelease(res.id)}
                            title="Release hold back to available stock"
                          >
                            <X size={12} /> Release
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-expire"
                            onClick={() => onExpire(res.id)}
                            title="Force TTL expire immediately"
                          >
                            <AlertTriangle size={12} /> Expire
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Final State
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
