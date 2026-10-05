import React, { useState } from 'react';
import type { OrderRecord, OrderStatus } from '../../types';
import {
  ORDER_LIFECYCLE_STEPS,
  VALID_ORDER_TRANSITIONS,
} from '../../services/orderService';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
} from 'lucide-react';

interface OrderDetailPanelProps {
  order: OrderRecord;
  onClose: () => void;
  onTransition: (orderId: string, nextStatus: OrderStatus, note?: string) => {
    success: boolean;
    message: string;
  };
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
  order,
  onClose,
  onTransition,
}) => {
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const allowedTransitions = VALID_ORDER_TRANSITIONS[order.orderStatus] || [];

  const handleAdvance = (nextStatus: OrderStatus) => {
    const res = onTransition(order.id, nextStatus);
    setFeedback(res);
  };

  const getStepStatus = (step: OrderStatus) => {
    const stepIdx = ORDER_LIFECYCLE_STEPS.indexOf(step);
    const currentIdx = ORDER_LIFECYCLE_STEPS.indexOf(order.orderStatus);

    if (order.orderStatus === 'CANCELLED') {
      return step === 'CANCELLED' ? 'current' : 'skipped';
    }

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="order-detail-backdrop" onClick={onClose}>
      <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="order-detail-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {order.id}
              </h2>
              <span className={`sample-badge ${order.orderStatus === 'DELIVERED' ? 'badge-emerald' : order.orderStatus === 'CANCELLED' ? 'badge-danger' : 'badge-cyan'}`}>
                {order.orderStatus}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Customer: <strong>{order.customerId}</strong></span>
              <span>•</span>
              <span>Total: <strong>${order.totalAmount.toFixed(2)}</strong></span>
            </div>
          </div>

          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="order-detail-body">
          {/* Linked Observability Trace IDs */}
          <div className="order-trace-bar">
            <div className="trace-item">
              <span className="trace-label">RESERVATION ID</span>
              <span className="trace-val font-mono text-cyan">{order.reservationId}</span>
            </div>
            <ArrowRight size={14} className="text-muted" />
            <div className="trace-item">
              <span className="trace-label">PAYMENT ID</span>
              <span className="trace-val font-mono text-emerald">{order.paymentId}</span>
            </div>
            <ArrowRight size={14} className="text-muted" />
            <div className="trace-item">
              <span className="trace-label">ORDER ID</span>
              <span className="trace-val font-mono" style={{ color: 'var(--accent-purple)' }}>{order.id}</span>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={`result-callout ${feedback.success ? 'result-success' : 'result-error'}`} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                {feedback.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {/* State Machine Transition Actions */}
          <div className="order-actions-bar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  VALID STATE TRANSITIONS:
                </span>
                <span className="font-mono text-cyan" style={{ fontSize: '0.72rem' }}>
                  Current State: <strong>{order.orderStatus}</strong>
                </span>
              </div>

              {allowedTransitions.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Terminal state reached ({order.orderStatus}). No further transitions allowed.
                </span>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {allowedTransitions.map((next) => (
                    <button
                      key={next}
                      type="button"
                      className={`btn-action ${next === 'CANCELLED' ? 'btn-action-expire' : 'btn-action-confirm'}`}
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      onClick={() => handleAdvance(next)}
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Advance to {next}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* State Machine Guard / Invalid Transition Tester */}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} className="text-amber" />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    State Machine Guard: Test rejection of invalid transitions
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    id="invalid-target-select"
                    className="form-input font-mono"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAdvance(e.target.value as OrderStatus);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="" disabled>Try illegal transition...</option>
                    {(['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[])
                      .filter((s) => !allowedTransitions.includes(s) && s !== order.orderStatus)
                      .map((s) => (
                        <option key={s} value={s}>
                          Attempt Jump → {s}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline (CREATED -> ... -> DELIVERED) */}
          <div className="timeline-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '0.5px' }}>
                ORDER LIFECYCLE TIMELINE
              </h3>
              <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                Deterministic Progression (CREATED ↓ ... ↓ DELIVERED)
              </span>
            </div>

            <div className="timeline-steps-list">
              {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                const stepState = getStepStatus(step);
                const recordedEvent = order.timeline.find((t) => t.status === step);

                return (
                  <div key={step}>
                    <div className={`timeline-step-row ${stepState}`}>
                      <div className="timeline-marker-column">
                        <div className={`timeline-marker-dot ${stepState}`}>
                          {stepState === 'completed' ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>{idx + 1}</span>
                          )}
                        </div>
                        {idx < ORDER_LIFECYCLE_STEPS.length - 1 && (
                          <div className={`timeline-marker-line ${stepState === 'completed' ? 'line-completed' : ''}`}>
                            <span className="timeline-down-arrow">↓</span>
                          </div>
                        )}
                      </div>

                      <div className="timeline-content-column">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="timeline-step-title font-mono">{step}</span>
                          {recordedEvent && (
                            <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                              {new Date(recordedEvent.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <div className="timeline-step-desc">
                          {recordedEvent ? recordedEvent.note : `Awaiting transition to ${step}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
