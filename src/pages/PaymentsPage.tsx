import React from 'react';
import { usePaymentStore } from '../hooks/usePaymentStore';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { PaymentSummaryCards } from '../components/payments/PaymentSummaryCards';
import { PaymentSimulationPanel } from '../components/payments/PaymentSimulationPanel';
import { PaymentTransactionTable } from '../components/payments/PaymentTransactionTable';
import { StatusBadge } from '../components/StatusBadge';
import { CreditCard, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const {
    payments,
    stats,
    config,
    simulatePayment,
    reconcilePayment,
    updateConfig,
    resetPayments,
  } = usePaymentStore();

  const { reservations } = useInventoryStore();

  const activeOrAllReservations = reservations.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    status: r.status,
    quantity: r.quantity,
  }));

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Payment Processing &amp; Reconciliation
            </h1>
            <StatusBadge label="SIMULATED GATEWAY" variant="cyan" pulse={true} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={14} className="text-cyan" />
            <span>Simulated idempotent payment authorization connected directly to expiring reservation state machines.</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetPayments}
            title="Reset payment history"
          >
            <RefreshCw size={14} />
            <span>RESET LOGS</span>
          </button>
          <StatusBadge
            label="IDEMPOTENCY ENFORCED"
            variant="emerald"
            icon={<ShieldCheck size={13} />}
          />
        </div>
      </div>

      {/* Safety / Compliance Callout */}
      <div className="simulation-explainer-box" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} className="text-amber" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
            <strong>Payment Gateway — SIMULATED:</strong> This environment models network latency, card declines, timeout boundaries, and idempotency deduplication. No real financial credentials or payment processors (Stripe, Adyen, etc.) are utilized.
          </div>
        </div>
      </div>

      {/* 1. Payment Summary Cards (Total, Successful, Failed, Timeouts, Pending) */}
      <PaymentSummaryCards stats={stats} />

      {/* 2. Interactive Payment Simulation Panel */}
      <PaymentSimulationPanel
        config={config}
        onUpdateConfig={updateConfig}
        onSimulate={simulatePayment}
        availableReservations={activeOrAllReservations}
      />

      {/* 3. Payment Transaction Table with Reconciliation Actions */}
      <PaymentTransactionTable
        payments={payments}
        onReconcile={reconcilePayment}
      />
    </div>
  );
};
