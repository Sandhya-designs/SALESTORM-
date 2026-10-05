import React from 'react';
import { Copy, ShieldCheck, CheckCircle2, Play, GitBranch, BellRing } from 'lucide-react';

interface DuplicateRequestDemoProps {
  duplicateState: {
    requestA: { processed: boolean; reservationId: string; paymentId: string; orderId: string };
    duplicateA: { processed: boolean; intercepted: boolean; message: string };
    eventDemo: {
      eventId: string;
      dispatch1: { processed: boolean; timeStr: string };
      dispatch2: { received: boolean; deduplicated: boolean; timeStr: string };
    };
  };
  onTriggerDuplicateRequest: () => void;
  onTriggerDuplicateEvent: () => void;
}

export const DuplicateRequestDemo: React.FC<DuplicateRequestDemoProps> = ({
  duplicateState,
  onTriggerDuplicateRequest,
  onTriggerDuplicateEvent,
}) => {
  const { requestA, duplicateA, eventDemo } = duplicateState;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
      {/* 1. Duplicate Purchase Request Card */}
      <div className="tester-panel-card" style={{ marginBottom: 0 }}>
        <div className="tester-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Copy size={18} className="text-cyan" />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
              DUPLICATE PURCHASE REQUEST
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onTriggerDuplicateRequest}
            style={{ fontSize: '0.74rem', padding: '6px 12px' }}
          >
            <Play size={12} fill="currentColor" />
            <span>TEST DUPLICATE REQUEST</span>
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
          Demonstrates client retries with identical <strong>Idempotency Keys</strong>. Ensures Request A and its duplicate produce exactly <em>one reservation, one payment, and one order</em>.
        </div>

        <div className="duplicate-comparison-box">
          {/* Request A */}
          <div className="duplicate-row">
            <div className="duplicate-label-box">
              <span className="font-mono font-bold text-cyan" style={{ fontSize: '0.78rem' }}>REQUEST A</span>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Initial submission</span>
            </div>
            <div className="duplicate-content-box">
              {requestA.processed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                    <CheckCircle2 size={13} className="text-emerald" />
                    <span>Allocated: <strong>{requestA.reservationId}</strong></span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Payment: <code className="text-emerald">{requestA.paymentId}</code> • Order: <code className="text-purple">{requestA.orderId}</code>
                  </div>
                </div>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.74rem', fontStyle: 'italic' }}>
                  Awaiting trigger...
                </span>
              )}
            </div>
          </div>

          {/* Request A Duplicate */}
          <div className="duplicate-row">
            <div className="duplicate-label-box">
              <span className="font-mono font-bold text-amber" style={{ fontSize: '0.78rem' }}>REQUEST A (DUP)</span>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Network duplicate</span>
            </div>
            <div className="duplicate-content-box">
              {duplicateA.processed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                  <ShieldCheck size={14} className="text-emerald" />
                  <span className="text-emerald font-bold">Intercepted &amp; Replayed Cache</span>
                </div>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.74rem', fontStyle: 'italic' }}>
                  Awaiting duplicate submission...
                </span>
              )}
            </div>
          </div>
        </div>

        {duplicateA.processed && (
          <div className="result-callout result-success" style={{ marginTop: '12px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
              <CheckCircle2 size={14} className="text-emerald" />
              <span>RESULT: EXACTLY 1 RESERVATION • 1 PAYMENT • 1 ORDER</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px' }}>
              Zero overselling. Second request re-used existing resources without duplicate charge or inventory decrement.
            </div>
          </div>
        )}
      </div>

      {/* 2. Duplicate Event / Consumer Idempotency Card */}
      <div className="tester-panel-card" style={{ marginBottom: 0 }}>
        <div className="tester-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellRing size={18} className="text-emerald" />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
              DUPLICATE MESSAGE / EVENT CONSUMER
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onTriggerDuplicateEvent}
            style={{ fontSize: '0.74rem', padding: '6px 12px' }}
          >
            <GitBranch size={12} />
            <span>DISPATCH DUPLICATE EVENT</span>
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
          Demonstrates message broker redelivery. Sends the same event ID twice. The consumer checks its <strong>deduplication index</strong> to ensure idempotent processing.
        </div>

        <div className="duplicate-comparison-box">
          {/* Dispatch 1 */}
          <div className="duplicate-row">
            <div className="duplicate-label-box">
              <span className="font-mono font-bold text-emerald" style={{ fontSize: '0.78rem' }}>EVENT DISPATCH 1</span>
              <span className="text-muted font-mono" style={{ fontSize: '0.68rem' }}>{eventDemo.eventId}</span>
            </div>
            <div className="duplicate-content-box">
              {eventDemo.dispatch1.processed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                  <CheckCircle2 size={13} className="text-emerald" />
                  <span>Processed by Worker 1 at <strong>{eventDemo.dispatch1.timeStr}</strong></span>
                </div>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.74rem', fontStyle: 'italic' }}>
                  Event not yet dispatched...
                </span>
              )}
            </div>
          </div>

          {/* Dispatch 2 (Duplicate) */}
          <div className="duplicate-row">
            <div className="duplicate-label-box">
              <span className="font-mono font-bold text-amber" style={{ fontSize: '0.78rem' }}>EVENT DISPATCH 2</span>
              <span className="text-muted font-mono" style={{ fontSize: '0.68rem' }}>Duplicate redelivery</span>
            </div>
            <div className="duplicate-content-box">
              {eventDemo.dispatch2.deduplicated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                  <ShieldCheck size={14} className="text-cyan" />
                  <span className="text-cyan font-bold">Already Processed: Dropped Idempotently</span>
                </div>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.74rem', fontStyle: 'italic' }}>
                  Awaiting duplicate event...
                </span>
              )}
            </div>
          </div>
        </div>

        {eventDemo.dispatch2.deduplicated && (
          <div className="result-callout result-success" style={{ marginTop: '12px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
              <CheckCircle2 size={14} className="text-emerald" />
              <span>CONSUMER IDEMPOTENCY CONFIRMED</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px' }}>
              Consumer ACKed the duplicate message without executing double state transitions or warehouse dispatch commands.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
