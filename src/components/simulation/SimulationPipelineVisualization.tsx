import React from 'react';
import type { SimulationStats } from '../../types';
import { ArrowDown, Cpu, ShieldCheck, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react';

interface SimulationPipelineVisualizationProps {
  stats: SimulationStats;
}

export const SimulationPipelineVisualization: React.FC<SimulationPipelineVisualizationProps> = ({
  stats,
}) => {
  const isOversold = stats.oversold > 0;
  const isRunning = stats.status === 'RUNNING';

  return (
    <div className="traffic-viz-container">
      {/* Header */}
      <div className="traffic-viz-header">
        <div className="traffic-viz-title">
          <Cpu size={18} className="text-cyan" />
          <span>CONCURRENCY PIPELINE & ATOMIC ARBITRATION</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOversold ? (
            <span className="badge badge-danger">CRITICAL INVARIANT VIOLATION</span>
          ) : (
            <span className="badge badge-emerald">ZERO OVERSELL INVARIANT ACTIVE</span>
          )}
        </div>
      </div>

      {/* Main Diagram Flow: 10,000 Requests -> Reservation Engine -> 100 Success / 9,900 Rejected */}
      <div className="simulation-diagram-flow">
        {/* Top Node: 10,000 Requests */}
        <div className="pipeline-node node-ingress" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="pipeline-node-icon">
            <Cpu size={20} />
          </div>
          <div className="pipeline-node-info">
            <div className="pipeline-node-title font-mono" style={{ fontSize: '1.05rem' }}>
              10,000 REQUESTS
            </div>
            <div className="pipeline-node-sub">High-burst concurrent purchase requests</div>
          </div>
          <div className="pipeline-node-metric font-mono text-cyan" style={{ fontSize: '1.1rem' }}>
            {stats.requestsProcessed.toLocaleString()} / 10,000
          </div>
        </div>

        {/* Down Arrow connector */}
        <div className="pipeline-connector">
          <div className={`pipeline-arrow-icon ${isRunning ? 'arrow-active' : ''}`}>
            <ArrowDown size={22} />
          </div>
          <span className="pipeline-connector-label">Admission &amp; Atomic Evaluation</span>
        </div>

        {/* Middle Node: Reservation Engine */}
        <div className="pipeline-node node-inventory" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="pipeline-node-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="pipeline-node-info">
            <div className="pipeline-node-title font-mono" style={{ fontSize: '1.05rem' }}>
              RESERVATION ENGINE
            </div>
            <div className="pipeline-node-sub">
              Atomic CAS barrier: <code>if (available &gt;= qty) reserve; else fail;</code>
            </div>
          </div>
          <div className="pipeline-node-metric font-mono text-cyan">
            Stock: {stats.remainingInventory} units
          </div>
        </div>

        {/* Down Arrow connector */}
        <div className="pipeline-connector">
          <div className={`pipeline-arrow-icon ${isRunning ? 'arrow-active' : ''}`}>
            <ArrowDown size={22} />
          </div>
          <span className="pipeline-connector-label">Deterministic Partitioning</span>
        </div>

        {/* Bottom Split Outcomes: 100 SUCCESS & 9,900 REJECTED */}
        <div className="pipeline-outcomes-split">
          {/* 100 SUCCESS */}
          <div className="pipeline-outcome-box outcome-success">
            <div className="outcome-icon icon-emerald">
              <CheckCircle2 size={24} />
            </div>
            <div className="outcome-title font-mono">100 SUCCESS</div>
            <div className="outcome-val font-mono text-emerald">
              {stats.successfulReservations} / 100
            </div>
            <div className="outcome-desc">
              Protected atomic allocations with confirmed locks
            </div>
          </div>

          {/* 9,900 REJECTED */}
          <div className="pipeline-outcome-box outcome-rejected">
            <div className="outcome-icon icon-amber">
              <XCircle size={24} />
            </div>
            <div className="outcome-title font-mono">9,900 REJECTED</div>
            <div className="outcome-val font-mono text-amber">
              {stats.failedReservations.toLocaleString()} REJECTED
            </div>
            <div className="outcome-desc">
              Deterministic rejections when available stock = 0
            </div>
          </div>
        </div>
      </div>

      {/* Large OVERSOLD: 0 Indicator Banner */}
      <div className={`oversold-indicator-banner ${isOversold ? 'oversold-critical' : 'oversold-safe'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isOversold ? (
            <AlertOctagon size={36} className="text-danger pulse-dot" />
          ) : (
            <ShieldCheck size={36} className="text-emerald" />
          )}
          <div>
            <div className="oversold-badge-label">HARD SAFETY INVARIANT</div>
            <div className="oversold-large-text font-mono">
              OVERSOLD: {stats.oversold}
            </div>
          </div>
        </div>

        <div className="oversold-banner-note">
          {isOversold ? (
            <span style={{ color: '#f43f5e', fontWeight: 700 }}>
              CRITICAL SAFETY ERROR: {stats.oversold} units over-allocated! System invariant violated.
            </span>
          ) : (
            <span>
              <strong>Zero-Oversell Verified:</strong> 100 units guaranteed to never produce &gt; 100 reservations under 10,000 competing requests.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
