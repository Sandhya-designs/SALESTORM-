import React from 'react';
import type { OutboxRetryStep } from '../../types';
import { Play, CheckCircle2, AlertTriangle, Clock, RefreshCw, ServerCrash, ShieldCheck } from 'lucide-react';

interface OrderServiceOutboxDemoProps {
  outboxSteps: OutboxRetryStep[];
  onTrigger: () => void;
}

export const OrderServiceOutboxDemo: React.FC<OrderServiceOutboxDemoProps> = ({
  outboxSteps,
  onTrigger,
}) => {
  const isRunning = outboxSteps.some((s) => s.status === 'active');
  const isCompleted = outboxSteps[4].status === 'completed';

  const getStepIcon = (s: OutboxRetryStep) => {
    switch (s.status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald" />;
      case 'failed':
        return <AlertTriangle size={16} className="text-rose" />;
      case 'active':
        return <RefreshCw size={16} className="text-cyan animate-spin" />;
      case 'pending':
      default:
        return <Clock size={16} className="text-muted" />;
    }
  };

  return (
    <div className="tester-panel-card" style={{ marginBottom: '24px' }}>
      <div className="tester-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ServerCrash size={18} className="text-rose" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            HIGHLIGHT: ORDER SERVICE FAILURE &amp; TRANSACTIONAL OUTBOX RETRY
          </span>
          <span className="sample-badge badge-danger">SIMULATED FAILURE</span>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onTrigger}
            disabled={isRunning}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isRunning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>SIMULATING OUTBOX RETRY...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>RUN ORDER SERVICE FAILURE DEMO</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: '18px', lineHeight: 1.5 }}>
        Demonstrates system behavior when <strong>Payment SUCCESS</strong> occurs while the downstream <strong>Order Service is DOWN</strong>.
        Crucial guarantee: <em>The payment must NOT disappear!</em> The transactional outbox pattern preserves the payment record, holds the event in an atomic outbox buffer, and retries until the order is successfully created.
      </div>

      {/* Outbox Progression Steps: PAYMENT SUCCESS ↓ ORDER SERVICE UNAVAILABLE ↓ EVENT PENDING ↓ RETRY ↓ ORDER CREATED */}
      <div className="outbox-pipeline-flow">
        {outboxSteps.map((step, idx) => {
          return (
            <React.Fragment key={step.step}>
              <div className={`outbox-node-card status-${step.status}`}>
                <div className="outbox-node-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getStepIcon(step)}
                    <span className="outbox-node-title font-mono">{step.label}</span>
                  </div>
                  <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                    {step.timeStr}
                  </span>
                </div>
                <div className="outbox-node-desc font-mono">{step.details}</div>
              </div>

              {idx < outboxSteps.length - 1 && (
                <div className="outbox-connector-column">
                  <span className="outbox-arrow-down">↓</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Result Callout */}
      {isCompleted && (
        <div className="result-callout result-success" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} className="text-emerald" />
            <span style={{ fontWeight: 700 }}>RESILIENCE GUARANTEE VALIDATED</span>
            <span className="badge badge-emerald">ZERO LOST PAYMENTS</span>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-subtle)' }}>
            Order Service outage handled flawlessly. Payment record was safely preserved in the persistent ledger, and the transactional outbox worker delivered the creation event to generate order <code>ORD-2026-OUTBOX</code> upon recovery.
          </div>
        </div>
      )}
    </div>
  );
};
