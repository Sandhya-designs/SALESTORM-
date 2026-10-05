import React, { useState } from 'react';
import type {
  PaymentSimulationConfig,
  SimulatePaymentRequest,
  SimulatePaymentResult,
} from '../../types';
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Layers,
  Info,
} from 'lucide-react';

interface PaymentSimulationPanelProps {
  config: PaymentSimulationConfig;
  onUpdateConfig: (newConfig: Partial<PaymentSimulationConfig>) => void;
  onSimulate: (req: SimulatePaymentRequest) => Promise<SimulatePaymentResult>;
  availableReservations: { id: string; customerId: string; status: string; quantity: number }[];
}

export const PaymentSimulationPanel: React.FC<PaymentSimulationPanelProps> = ({
  config,
  onUpdateConfig,
  onSimulate,
  availableReservations,
}) => {
  const [selectedResId, setSelectedResId] = useState<string>(
    availableReservations[0]?.id || 'RES-DEMO-01'
  );
  const [customerId, setCustomerId] = useState<string>(
    availableReservations[0]?.customerId || 'usr_alpha_101'
  );
  const [amount, setAmount] = useState<number>(49.99);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => `idem_pay_${Math.random().toString(36).substring(2, 7)}`
  );
  const [forcedOutcome, setForcedOutcome] = useState<'AUTO' | 'SUCCESS' | 'FAILURE' | 'TIMEOUT'>('AUTO');
  const [lastResult, setLastResult] = useState<SimulatePaymentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSelectReservation = (resId: string) => {
    setSelectedResId(resId);
    const found = availableReservations.find((r) => r.id === resId);
    if (found) {
      setCustomerId(found.customerId);
      setAmount(found.quantity * 49.99);
    }
  };

  const handleGenerateKey = () => {
    setIdempotencyKey(`idem_pay_${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const result = await onSimulate({
        reservationId: selectedResId,
        customerId: customerId.trim(),
        amount: Number(amount),
        idempotencyKey: idempotencyKey.trim(),
        forcedOutcome,
      });
      setLastResult(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tester-panel-card">
      {/* Obvious Simulated Notice Banner */}
      <div className="simulated-gateway-badge-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} className="text-cyan" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            PAYMENT GATEWAY — SIMULATED
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Info size={13} className="text-cyan" />
          <span>Local sandbox simulation • Zero financial transactions • No real card details stored</span>
        </div>
      </div>

      {/* Outcome Probability Sliders */}
      <div className="payment-rates-grid">
        <div className="rate-slider-item">
          <div className="rate-slider-label">
            <span className="text-emerald font-bold">SUCCESS RATE:</span>
            <span className="font-mono">{config.successRate}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={config.successRate}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateConfig({
                successRate: val,
                failureRate: Math.max(0, 100 - val),
              });
            }}
            className="range-input"
          />
        </div>

        <div className="rate-slider-item">
          <div className="rate-slider-label">
            <span className="text-amber font-bold">FAILURE RATE:</span>
            <span className="font-mono">{config.failureRate}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={config.failureRate}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateConfig({
                failureRate: val,
                successRate: Math.max(0, 100 - val),
              });
            }}
            className="range-input"
          />
        </div>

        <div className="rate-slider-item">
          <div className="rate-slider-label">
            <span className="text-cyan font-bold">TIMEOUT RATE:</span>
            <span className="font-mono">{config.timeoutRate}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={config.timeoutRate}
            onChange={(e) => onUpdateConfig({ timeoutRate: Number(e.target.value) })}
            className="range-input"
          />
        </div>
      </div>

      {/* Manual Trigger Option */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          MANUALLY FORCED OUTCOME:
        </span>
        <div className="speed-pills">
          {(['AUTO', 'SUCCESS', 'FAILURE', 'TIMEOUT'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`speed-pill ${forcedOutcome === mode ? 'active' : ''}`}
              onClick={() => setForcedOutcome(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="tester-form-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1.5fr 1.4fr' }}>
        <div className="form-group">
          <label>SELECT RESERVATION</label>
          <select
            className="form-input font-mono"
            value={selectedResId}
            onChange={(e) => handleSelectReservation(e.target.value)}
          >
            {availableReservations.length > 0 ? (
              availableReservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.customerId}) [{r.status}]
                </option>
              ))
            ) : (
              <option value="RES-DEMO-01">RES-DEMO-01 (Demo Reserve)</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>CUSTOMER ID</label>
          <input
            type="text"
            className="form-input font-mono"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>AMOUNT ($ USD)</label>
          <input
            type="number"
            step="0.01"
            className="form-input font-mono"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>IDEMPOTENCY KEY</label>
            <button
              type="button"
              className="btn-link"
              onClick={handleGenerateKey}
              title="Generate fresh idempotency key"
            >
              <RefreshCw size={11} /> New Key
            </button>
          </div>
          <input
            type="text"
            className="form-input font-mono"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            required
          />
        </div>

        <div className="form-actions-inline">
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 14px' }}
            disabled={isProcessing}
          >
            <Send size={15} />
            <span>{isProcessing ? 'AUTHORIZING...' : 'SIMULATE PAYMENT'}</span>
          </button>
        </div>
      </form>

      {/* Visual State Transition Display */}
      {lastResult && (
        <div
          className={`result-callout ${
            lastResult.payment.status === 'SUCCESS'
              ? 'result-success'
              : lastResult.payment.status === 'FAILED'
              ? 'result-error'
              : 'result-warning'
          }`}
          style={{ marginTop: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lastResult.payment.status === 'SUCCESS' ? (
                <CheckCircle2 size={18} className="text-emerald" />
              ) : lastResult.payment.status === 'FAILED' ? (
                <XCircle size={18} className="text-amber" />
              ) : (
                <AlertTriangle size={18} className="text-amber" />
              )}
              <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                PAYMENT STATUS: {lastResult.payment.status}
              </span>
            </div>

            {lastResult.isIdempotentReplay && (
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={12} /> IDEMPOTENT REPLAY — NO DOUBLE CHARGE
              </span>
            )}
          </div>

          {/* Visual Lifecycle Arrow */}
          <div className="payment-transition-arrow-box font-mono">
            <span className="state-badge">RESERVED</span>
            <span className="transition-arrow">→</span>
            <span className="state-badge state-pending">PAYMENT_PENDING</span>
            <span className="transition-arrow">→</span>
            <span
              className={`state-badge ${
                lastResult.payment.status === 'SUCCESS'
                  ? 'state-confirmed'
                  : lastResult.payment.status === 'FAILED'
                  ? 'state-released'
                  : 'state-reconcile'
              }`}
            >
              {lastResult.payment.status === 'SUCCESS'
                ? 'CONFIRMED'
                : lastResult.payment.status === 'FAILED'
                ? 'RELEASED'
                : 'RECONCILIATION_REQUIRED'}
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', marginTop: '8px', color: 'var(--text-subtle)' }}>
            {lastResult.message}
          </div>
        </div>
      )}
    </div>
  );
};
