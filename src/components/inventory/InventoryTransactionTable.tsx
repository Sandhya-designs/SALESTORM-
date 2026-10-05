import React from 'react';
import type { Reservation } from '../../types';
import { Check, X, AlertTriangle, Shield } from 'lucide-react';

interface InventoryTransactionTableProps {
  reservations: Reservation[];
  onRelease: (id: string) => void;
  onConfirm: (id: string) => void;
  onExpire: (id: string) => void;
}

export const InventoryTransactionTable: React.FC<InventoryTransactionTableProps> = ({
  reservations,
  onRelease,
  onConfirm,
  onExpire,
}) => {
  const getStatusBadge = (status: Reservation['status']) => {
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

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  const getRemainingTtl = (expiresAt: number, status: Reservation['status']) => {
    if (status !== 'RESERVED') {
      return '-';
    }
    const rem = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    return rem > 0 ? `${rem}s remaining` : 'Expiring...';
  };

  return (
    <div className="traffic-table-card">
      <div className="traffic-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} className="text-cyan" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
            INVENTORY TRANSACTION &amp; ALLOCATION LEDGER
          </span>
        </div>
        <div className="traffic-table-sub font-mono">{reservations.length} total entries</div>
      </div>

      <div className="table-responsive">
        <table className="flash-table">
          <thead>
            <tr>
              <th>RESERVATION ID</th>
              <th>CUSTOMER</th>
              <th>QUANTITY</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>EXPIRES</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No reservations recorded yet. Use the harness above to create one.
                </td>
              </tr>
            ) : (
              reservations.map((res) => {
                const isActive = res.status === 'RESERVED';
                return (
                  <tr key={res.id}>
                    <td className="font-mono text-cyan">{res.id}</td>
                    <td className="font-mono">{res.customerId}</td>
                    <td className="font-mono font-bold" style={{ color: '#ffffff' }}>
                      {res.quantity}
                    </td>
                    <td>{getStatusBadge(res.status)}</td>
                    <td className="font-mono text-muted">{formatTime(res.createdAt)}</td>
                    <td className="font-mono text-amber">
                      {formatTime(res.expiresAt)}{' '}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({getRemainingTtl(res.expiresAt, res.status)})
                      </span>
                    </td>
                    <td>
                      {isActive ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-action btn-action-confirm"
                            onClick={() => onConfirm(res.id)}
                            title="Confirm order (sold += qty, reserved -= qty)"
                          >
                            <Check size={12} /> Confirm
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-release"
                            onClick={() => onRelease(res.id)}
                            title="Release stock back (available += qty, reserved -= qty)"
                          >
                            <X size={12} /> Release
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-expire"
                            onClick={() => onExpire(res.id)}
                            title="Force TTL expire"
                          >
                            <AlertTriangle size={12} /> Expire
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Finalized
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
