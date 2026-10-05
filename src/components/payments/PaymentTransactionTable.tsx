import React from 'react';
import type { PaymentRecord, PaymentStatus } from '../../types';
import { CreditCard, Check, X, ShieldAlert, Key } from 'lucide-react';

interface PaymentTransactionTableProps {
  payments: PaymentRecord[];
  onReconcile: (id: string, resolution: 'SUCCESS' | 'FAILED') => void;
}

export const PaymentTransactionTable: React.FC<PaymentTransactionTableProps> = ({
  payments,
  onReconcile,
}) => {
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="sample-badge badge-emerald">SUCCESS</span>;
      case 'FAILED':
        return <span className="sample-badge badge-danger">FAILED</span>;
      case 'TIMEOUT':
        return <span className="sample-badge badge-amber">TIMEOUT</span>;
      case 'RECONCILIATION_REQUIRED':
        return <span className="sample-badge badge-amber">RECONCILIATION REQUIRED</span>;
      case 'PROCESSING':
        return <span className="sample-badge badge-purple">PROCESSING</span>;
      case 'INITIATED':
      default:
        return <span className="sample-badge badge-cyan">INITIATED</span>;
    }
  };

  return (
    <div className="traffic-table-card">
      <div className="traffic-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} className="text-cyan" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
            PAYMENT TRANSACTION LEDGER &amp; AUDIT TRAIL
          </span>
        </div>
        <div className="traffic-table-sub font-mono">{payments.length} transactions logged</div>
      </div>

      <div className="table-responsive">
        <table className="flash-table">
          <thead>
            <tr>
              <th>PAYMENT ID</th>
              <th>RESERVATION ID</th>
              <th>CUSTOMER ID</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>IDEMPOTENCY KEY</th>
              <th>TIMESTAMP</th>
              <th>RECONCILIATION ACTION</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No payment transactions recorded yet. Use the simulation panel above.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const needsReconciliation =
                  p.status === 'RECONCILIATION_REQUIRED' || p.status === 'TIMEOUT';

                return (
                  <tr key={p.id}>
                    <td className="font-mono text-cyan font-bold">{p.id}</td>
                    <td className="font-mono text-muted">{p.reservationId}</td>
                    <td className="font-mono">{p.customerId}</td>
                    <td className="font-mono font-bold" style={{ color: '#ffffff' }}>
                      ${p.amount.toFixed(2)}
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Key size={11} className="text-cyan" />
                        {p.idempotencyKey}
                      </span>
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>
                      {new Date(p.createdAt).toLocaleTimeString()}
                    </td>
                    <td>
                      {needsReconciliation ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-action btn-action-confirm"
                            onClick={() => onReconcile(p.id, 'SUCCESS')}
                            title="Confirm payment capture & confirm reservation"
                          >
                            <Check size={12} /> Confirm Succeeded
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-expire"
                            onClick={() => onReconcile(p.id, 'FAILED')}
                            title="Resolve as failed & release reservation lock"
                          >
                            <X size={12} /> Resolve Failed
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={11} /> Settled
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
