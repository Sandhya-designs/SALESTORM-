import React, { useState } from 'react';
import type { ReserveRequest, ReserveResult } from '../../types';
import { PlusCircle, Sparkles, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ReserveTesterPanelProps {
  onReserve: (req: ReserveRequest) => ReserveResult;
  availableStock: number;
}

export const ReserveTesterPanel: React.FC<ReserveTesterPanelProps> = ({
  onReserve,
  availableStock,
}) => {
  const [customerId, setCustomerId] = useState('usr_alice_77');
  const [quantity, setQuantity] = useState<number>(1);
  const [idempotencyKey, setIdempotencyKey] = useState(() => `idem_${Math.random().toString(36).substring(2, 7)}`);
  const [ttlSeconds, setTtlSeconds] = useState<number>(60);
  const [lastResult, setLastResult] = useState<ReserveResult | null>(null);

  const handleGenerateIdemKey = () => {
    setIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onReserve({
      customerId: customerId.trim(),
      quantity: Number(quantity),
      idempotencyKey: idempotencyKey.trim(),
      ttlSeconds: Number(ttlSeconds),
    });
    setLastResult(result);
  };

  return (
    <div className="tester-panel-card">
      <div className="tester-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} className="text-cyan" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
            ATOMIC RESERVATION & IDEMPOTENCY TEST HARNESS
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Test atomic allocation &amp; duplicate key prevention
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tester-form-grid">
        <div className="form-group">
          <label>CUSTOMER ID</label>
          <input
            type="text"
            className="form-input"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="e.g. usr_alice_77"
            required
          />
        </div>

        <div className="form-group">
          <label>QUANTITY (AVAILABLE: {availableStock})</label>
          <input
            type="number"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={100}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>IDEMPOTENCY KEY</label>
            <button
              type="button"
              className="btn-link"
              onClick={handleGenerateIdemKey}
              title="Generate new unique key"
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

        <div className="form-group">
          <label>EXPIRY TTL (SECONDS)</label>
          <select
            className="form-input"
            value={ttlSeconds}
            onChange={(e) => setTtlSeconds(Number(e.target.value))}
          >
            <option value={10}>10 seconds (Quick test)</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds (1 min)</option>
            <option value={300}>300 seconds (5 min)</option>
          </select>
        </div>

        <div className="form-actions-inline">
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <PlusCircle size={15} />
            <span>EXECUTE ATOMIC RESERVE</span>
          </button>
        </div>
      </form>

      {lastResult && (
        <div
          className={`result-callout ${
            lastResult.success ? 'result-success' : 'result-error'
          }`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastResult.success ? (
              <CheckCircle size={16} className="text-emerald" />
            ) : (
              <AlertCircle size={16} className="text-amber" />
            )}
            <span style={{ fontWeight: 700 }}>
              {lastResult.isIdempotentReplay
                ? 'IDEMPOTENT REPLAY DETECTED'
                : lastResult.success
                ? 'RESERVATION SUCCESSFUL'
                : 'RESERVATION REJECTED'}
            </span>
            {lastResult.isIdempotentReplay && (
              <span className="badge badge-cyan">EXACTLY-ONCE</span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-subtle)' }}>
            {lastResult.message}
          </div>
        </div>
      )}
    </div>
  );
};
