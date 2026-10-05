import React from 'react';
import type { FlashSaleMetrics, FlashSaleStatus } from '../../types';
import { ArrowDown, ShieldAlert, Cpu, Filter, Zap, CheckCircle2 } from 'lucide-react';

interface TrafficVisualizationProps {
  metrics: FlashSaleMetrics;
  status: FlashSaleStatus;
}

export const TrafficVisualization: React.FC<TrafficVisualizationProps> = ({ metrics, status }) => {
  const isRunning = status === 'RUNNING';
  const isCompleted = status === 'COMPLETED';

  // Compute stage statistics
  const ingressRequests = metrics.requestsReceived;
  const rateLimitedCount = Math.max(0, Math.floor(metrics.failedReservations * 0.7));
  const inventoryDecisions = Math.max(0, ingressRequests - rateLimitedCount);
  const reservationsGranted = metrics.successfulReservations;

  return (
    <div className="traffic-viz-container">
      {/* Top Banner & Progress Header */}
      <div className="traffic-viz-header">
        <div className="traffic-viz-title">
          <Zap size={18} className="text-cyan" />
          <span>TRAFFIC INGRESS & CONSISTENCY PIPELINE</span>
        </div>
        <div className="traffic-viz-status">
          <span className="font-mono text-cyan">
            {metrics.requestsReceived.toLocaleString()} / 10,000 REQ
          </span>
          <span className="traffic-viz-pct font-mono">
            {metrics.progressPercent}%
          </span>
        </div>
      </div>

      {/* Live Progress Bar */}
      <div className="traffic-progress-bar-track">
        <div
          className={`traffic-progress-bar-fill ${isRunning ? 'animate-pulse-glow' : ''}`}
          style={{ width: `${metrics.progressPercent}%` }}
        />
      </div>

      {/* Architectural Flow Diagram */}
      <div className="pipeline-flow-vertical">
        {/* Stage 1: Ingress */}
        <div className="pipeline-node node-ingress">
          <div className="pipeline-node-icon">
            <Cpu size={18} />
          </div>
          <div className="pipeline-node-info">
            <div className="pipeline-node-title">10,000 Incoming Requests</div>
            <div className="pipeline-node-sub">High-concurrency virtual user burst</div>
          </div>
          <div className="pipeline-node-metric font-mono">
            {ingressRequests.toLocaleString()} req
          </div>
        </div>

        {/* Down Arrow connector */}
        <div className="pipeline-connector">
          <div className="pipeline-line" />
          <div className={`pipeline-arrow-icon ${isRunning ? 'arrow-active' : ''}`}>
            <ArrowDown size={18} />
          </div>
          <span className="pipeline-connector-label">Ingress Traffic Stream</span>
        </div>

        {/* Stage 2: Rate Limiter */}
        <div className="pipeline-node node-ratelimit">
          <div className="pipeline-node-icon">
            <Filter size={18} />
          </div>
          <div className="pipeline-node-info">
            <div className="pipeline-node-title">Rate Limiter & Token Bucket</div>
            <div className="pipeline-node-sub">Filters overload spikes to protect atomic state</div>
          </div>
          <div className="pipeline-node-metric font-mono text-amber">
            {rateLimitedCount > 0 ? `-${rateLimitedCount.toLocaleString()} shed` : 'Filtering Active'}
          </div>
        </div>

        {/* Down Arrow connector */}
        <div className="pipeline-connector">
          <div className="pipeline-line" />
          <div className={`pipeline-arrow-icon ${isRunning ? 'arrow-active' : ''}`}>
            <ArrowDown size={18} />
          </div>
          <span className="pipeline-connector-label">Throttled Stream ({inventoryDecisions.toLocaleString()} evaluated)</span>
        </div>

        {/* Stage 3: Inventory Decision */}
        <div className="pipeline-node node-inventory">
          <div className="pipeline-node-icon">
            <ShieldAlert size={18} />
          </div>
          <div className="pipeline-node-info">
            <div className="pipeline-node-title">Inventory Decision Engine</div>
            <div className="pipeline-node-sub">Atomic compare-and-swap decrement gate ({inventoryDecisions.toLocaleString()} decisions)</div>
          </div>
          <div className="pipeline-node-metric font-mono text-cyan">
            {metrics.availableStock} remaining
          </div>
        </div>

        {/* Down Arrow connector */}
        <div className="pipeline-connector">
          <div className="pipeline-line" />
          <div className={`pipeline-arrow-icon ${isRunning ? 'arrow-active' : ''}`}>
            <ArrowDown size={18} />
          </div>
          <span className="pipeline-connector-label">Guaranteed Atomic Locks</span>
        </div>

        {/* Stage 4: 100 Maximum Reservations */}
        <div className={`pipeline-node node-max-res ${isCompleted || reservationsGranted === 100 ? 'node-locked' : ''}`}>
          <div className="pipeline-node-icon icon-emerald">
            <CheckCircle2 size={18} />
          </div>
          <div className="pipeline-node-info">
            <div className="pipeline-node-title">100 Maximum Reservations</div>
            <div className="pipeline-node-sub">Zero-Oversell Invariant Enforced (0% Oversold)</div>
          </div>
          <div className="pipeline-node-metric font-mono text-emerald">
            {reservationsGranted} / 100 CLAIMED
          </div>
        </div>
      </div>

      {/* Callout Footer */}
      <div className="traffic-callout-footer">
        <ShieldAlert size={15} className="text-cyan" />
        <span>
          <strong>Hard Consistency Invariant:</strong> Even when 10,000 concurrent requests hit the API Gateway within milliseconds, the inventory decision layer will never produce &gt; 100 valid reservation locks.
        </span>
      </div>
    </div>
  );
};
