import React, { useState } from 'react';
import type { OrderRecord, PaymentRecord, Reservation } from '../../types';
import { Network, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

interface OrderTraceDemoBoxProps {
  onRunDemo: () => { reservation: Reservation; payment: PaymentRecord; order: OrderRecord } | null;
  onSelectOrder: (order: OrderRecord) => void;
}

export const OrderTraceDemoBox: React.FC<OrderTraceDemoBoxProps> = ({
  onRunDemo,
  onSelectOrder,
}) => {
  const [lastTrace, setLastTrace] = useState<{
    reservation: Reservation;
    payment: PaymentRecord;
    order: OrderRecord;
  } | null>(null);

  const handleRun = () => {
    const trace = onRunDemo();
    if (trace) {
      setLastTrace(trace);
      onSelectOrder(trace.order);
    }
  };

  return (
    <div className="tester-panel-card">
      <div className="tester-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} className="text-cyan" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            END-TO-END TRACEABILITY FLOW (RESERVATION → PAYMENT → ORDER)
          </span>
        </div>
        <div>
          <button type="button" className="btn btn-primary" onClick={handleRun}>
            <Play size={14} fill="currentColor" />
            <span>EXECUTE LINKED TRACE DEMO</span>
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: '16px', lineHeight: 1.5 }}>
        Demonstrates distributed request lifecycle correlation. Each completed purchase generates a deterministic correlation link connecting the <strong>Reservation ID</strong>, <strong>Payment ID</strong>, and <strong>Order ID</strong>.
      </div>

      {/* Connected Trace Nodes */}
      <div className="trace-flow-connected-grid">
        {/* Node 1: Reservation */}
        <div className="trace-node-card">
          <div className="trace-node-badge badge-cyan">STAGE 1: ATOMIC LOCK</div>
          <div className="trace-node-id font-mono text-cyan">
            {lastTrace ? lastTrace.reservation.id : 'RES-SAMPLE-01'}
          </div>
          <div className="trace-node-sub font-mono">
            Qty: {lastTrace ? lastTrace.reservation.quantity : 1} unit • Status: {lastTrace ? lastTrace.reservation.status : 'CONFIRMED'}
          </div>
        </div>

        <div className="trace-arrow-connector">
          <ArrowRight size={20} className="text-cyan" />
        </div>

        {/* Node 2: Payment */}
        <div className="trace-node-card">
          <div className="trace-node-badge badge-emerald">STAGE 2: CAPTURE</div>
          <div className="trace-node-id font-mono text-emerald">
            {lastTrace ? lastTrace.payment.id : 'PAY-SAMPLE-01'}
          </div>
          <div className="trace-node-sub font-mono">
            Amount: ${lastTrace ? lastTrace.payment.amount.toFixed(2) : '49.99'} • Status: {lastTrace ? lastTrace.payment.status : 'SUCCESS'}
          </div>
        </div>

        <div className="trace-arrow-connector">
          <ArrowRight size={20} className="text-emerald" />
        </div>

        {/* Node 3: Order */}
        <div className="trace-node-card">
          <div className="trace-node-badge badge-purple">STAGE 3: COMMITMENT</div>
          <div className="trace-node-id font-mono" style={{ color: 'var(--accent-purple)' }}>
            {lastTrace ? lastTrace.order.id : 'ORD-2026-SAMPLE'}
          </div>
          <div className="trace-node-sub font-mono">
            Status: {lastTrace ? lastTrace.order.orderStatus : 'CONFIRMED'} • In Transit
          </div>
        </div>
      </div>

      {lastTrace && (
        <div className="result-callout result-success" style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} className="text-emerald" />
            <span style={{ fontWeight: 700 }}>TRACE CORRELATION ESTABLISHED</span>
            <span className="badge badge-emerald">ZERO OVERSELL INVARIANT SATISFIED</span>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-subtle)' }}>
            Trace link created for customer <strong>{lastTrace.order.customerId}</strong>: Connected{' '}
            <code>{lastTrace.reservation.id}</code> → <code>{lastTrace.payment.id}</code> →{' '}
            <code>{lastTrace.order.id}</code>. Click the order row in the ledger below to inspect the timeline.
          </div>
        </div>
      )}
    </div>
  );
};
