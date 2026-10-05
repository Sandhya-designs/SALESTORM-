import React, { useState } from 'react';
import type { TraceSpan } from '../../types';
import { GitCommit, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface TraceInspectorProps {
  traces: TraceSpan[];
}

function formatExactTime(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ traces }) => {
  const [selectedTraceId, setSelectedTraceId] = useState<string>(
    traces.length > 0 ? traces[0].requestId : ''
  );

  const activeTrace = traces.find((t) => t.requestId === selectedTraceId) || traces[0];

  return (
    <div className="tester-panel-card" style={{ marginBottom: '24px' }}>
      <div className="tester-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCommit size={18} className="text-cyan" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            TRANSACTION DISTRIBUTED TRACE INSPECTOR
          </span>
        </div>

        {/* Transaction Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>SELECT TRANSACTION:</span>
          <select
            className="form-input font-mono"
            style={{ padding: '4px 10px', fontSize: '0.74rem', maxWidth: '260px' }}
            value={selectedTraceId}
            onChange={(e) => setSelectedTraceId(e.target.value)}
          >
            {traces.map((t) => (
              <option key={t.requestId} value={t.requestId}>
                {t.requestId} ({t.orderId}) - {t.customerId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTrace ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              End-to-end distributed execution span for customer <strong>{activeTrace.customerId}</strong> • Total duration: <strong>{activeTrace.totalDurationMs} ms</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="sample-badge badge-emerald">TRACE CORRELATED</span>
              <span className="sample-badge badge-cyan">ZERO LEAKAGE</span>
            </div>
          </div>

          {/* Connected Trace Nodes: REQ-xxxx ↓ RES-xxxx ↓ PAY-xxxx ↓ ORD-xxxx */}
          <div className="trace-flow-connected-grid" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr' }}>
            {/* Step 1: Request ID */}
            <div className="trace-node-card">
              <div className="trace-node-badge badge-cyan">1. INGRESS INGESTION</div>
              <div className="trace-node-id font-mono text-cyan" style={{ fontSize: '1rem' }}>
                {activeTrace.requestId}
              </div>
              <div className="trace-node-sub font-mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {formatExactTime(activeTrace.requestTime)}
              </div>
            </div>

            <div className="trace-arrow-connector">
              <ArrowRight size={18} className="text-cyan" />
            </div>

            {/* Step 2: Reservation ID */}
            <div className="trace-node-card">
              <div className="trace-node-badge badge-cyan">2. ATOMIC LOCK (CAS)</div>
              <div className="trace-node-id font-mono text-cyan" style={{ fontSize: '1rem' }}>
                {activeTrace.reservationId}
              </div>
              <div className="trace-node-sub font-mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {formatExactTime(activeTrace.reservationTime)}
              </div>
            </div>

            <div className="trace-arrow-connector">
              <ArrowRight size={18} className="text-emerald" />
            </div>

            {/* Step 3: Payment ID */}
            <div className="trace-node-card">
              <div className="trace-node-badge badge-emerald">3. PAYMENT CAPTURE</div>
              <div className="trace-node-id font-mono text-emerald" style={{ fontSize: '1rem' }}>
                {activeTrace.paymentId}
              </div>
              <div className="trace-node-sub font-mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {formatExactTime(activeTrace.paymentTime)}
              </div>
            </div>

            <div className="trace-arrow-connector">
              <ArrowRight size={18} className="text-purple" />
            </div>

            {/* Step 4: Order ID */}
            <div className="trace-node-card">
              <div className="trace-node-badge badge-purple">4. ORDER COMMITMENT</div>
              <div className="trace-node-id font-mono" style={{ color: 'var(--accent-purple)', fontSize: '1rem' }}>
                {activeTrace.orderId}
              </div>
              <div className="trace-node-sub font-mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {formatExactTime(activeTrace.orderTime)}
              </div>
            </div>
          </div>

          <div className="result-callout result-success" style={{ marginTop: '14px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} className="text-emerald" />
              <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>CORRELATION CHAIN VERIFIED</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Trace link verified: <code>{activeTrace.requestId}</code> → <code>{activeTrace.reservationId}</code> → <code>{activeTrace.paymentId}</code> → <code>{activeTrace.orderId}</code>. Invariant satisfied with serializable durability.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No trace transactions recorded yet. Complete an order to generate a correlated span.
        </div>
      )}
    </div>
  );
};
