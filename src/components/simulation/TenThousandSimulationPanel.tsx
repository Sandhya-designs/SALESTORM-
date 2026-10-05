import React from 'react';
import type { SimulationStats } from '../../types';
import { Play, Pause, RotateCcw, Zap, Laptop, ShieldCheck, Gauge } from 'lucide-react';

interface TenThousandSimulationPanelProps {
  stats: SimulationStats;
  progressPercent: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const TenThousandSimulationPanel: React.FC<TenThousandSimulationPanelProps> = ({
  stats,
  progressPercent,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  const isRunning = stats.status === 'RUNNING';
  const isPaused = stats.status === 'PAUSED';
  const isCompleted = stats.status === 'COMPLETED';

  return (
    <div className="flash-config-panel">
      {/* Simulation Header */}
      <div className="flash-config-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} className="text-cyan" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            HIGH-CONCURRENCY STRESS ENGINE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-dark">
            <Laptop size={12} /> Local Concurrency Simulation
          </span>
          <span className={`badge ${isCompleted ? 'badge-emerald' : isRunning ? 'badge-cyan' : 'badge-dark'}`}>
            {stats.status}
          </span>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="simulation-explainer-box">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <ShieldCheck size={18} className="text-cyan" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
            <strong>Local Concurrency Simulation:</strong> Demonstrates zero-oversell atomicity under a 10,000-request burst against a strict pool of 100 inventory units.
            In production, this same invariant is enforced at the transactional database / distributed lock boundary (e.g. Redis Lua script or PostgreSQL <code>UPDATE ... WHERE available &gt;= quantity</code>).
          </div>
        </div>
      </div>

      {/* Progress & Live Throughput Bar */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Progress:</span>
            <span className="font-mono text-cyan" style={{ fontWeight: 700 }}>
              {stats.requestsProcessed.toLocaleString()} / {stats.totalRequests.toLocaleString()} requests
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--font-mono)' }}>
            {stats.batchRate > 0 && (
              <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={13} /> {stats.batchRate.toLocaleString()} req/sec
              </span>
            )}
            <span className="traffic-viz-pct">{progressPercent}%</span>
          </div>
        </div>

        <div className="traffic-progress-bar-track">
          <div
            className={`traffic-progress-bar-fill ${isRunning ? 'animate-pulse-glow' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flash-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Elapsed: <strong>{(stats.elapsedMs / 1000).toFixed(2)}s</strong></span>
          <span>•</span>
          <span>Batch Size: <strong>200 req/tick</strong></span>
        </div>

        <div className="action-buttons">
          {isRunning ? (
            <button type="button" className="btn btn-warning" onClick={onPause}>
              <Pause size={15} />
              <span>PAUSE SIMULATION</span>
            </button>
          ) : isPaused ? (
            <button type="button" className="btn btn-primary" onClick={onResume}>
              <Play size={15} fill="currentColor" />
              <span>RESUME SIMULATION</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStart}
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <Play size={16} fill="currentColor" />
              <span>START 10,000 REQUEST SIMULATION</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            disabled={stats.status === 'IDLE' && stats.requestsProcessed === 0}
          >
            <RotateCcw size={15} />
            <span>RESET SIMULATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
