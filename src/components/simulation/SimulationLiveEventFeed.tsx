import React from 'react';
import type { SimulationLiveEvent } from '../../types';
import { Terminal, CheckCircle, XCircle, AlertOctagon, Info } from 'lucide-react';

interface SimulationLiveEventFeedProps {
  events: SimulationLiveEvent[];
  isRunning: boolean;
}

export const SimulationLiveEventFeed: React.FC<SimulationLiveEventFeedProps> = ({
  events,
  isRunning,
}) => {
  const getEventBadge = (type: SimulationLiveEvent['type']) => {
    switch (type) {
      case 'RESERVATION_SUCCESS':
        return <span className="sample-badge badge-emerald">SUCCESS</span>;
      case 'OUT_OF_STOCK':
        return <span className="sample-badge badge-danger">OUT OF STOCK</span>;
      case 'RESERVATION_FAILED':
        return <span className="sample-badge badge-amber">REJECTED</span>;
      case 'REQUEST_RECEIVED':
      default:
        return <span className="sample-badge badge-cyan">RECEIVED</span>;
    }
  };

  const getEventIcon = (type: SimulationLiveEvent['type']) => {
    switch (type) {
      case 'RESERVATION_SUCCESS':
        return <CheckCircle size={14} className="text-emerald" />;
      case 'OUT_OF_STOCK':
        return <AlertOctagon size={14} className="text-danger" />;
      case 'RESERVATION_FAILED':
        return <XCircle size={14} className="text-amber" />;
      case 'REQUEST_RECEIVED':
      default:
        return <Info size={14} className="text-cyan" />;
    }
  };

  return (
    <div className="activity-feed-card" style={{ height: '380px' }}>
      <div className="activity-feed-header">
        <div className="activity-feed-title">
          <Terminal size={16} className="text-cyan" />
          <span>SCROLLING EVENT FEED (STREAMING TELEMETRY)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRunning && <span className="status-dot pulse-dot" />}
          <span className="activity-feed-count font-mono">
            {events.length} buffered frames
          </span>
        </div>
      </div>

      <div className="activity-feed-body">
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Simulation idle. Click "START 10,000 REQUEST SIMULATION" to stream events.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className={`activity-log-item ${
                ev.type === 'RESERVATION_SUCCESS'
                  ? 'log-success'
                  : ev.type === 'OUT_OF_STOCK'
                  ? 'log-alert'
                  : ev.type === 'RESERVATION_FAILED'
                  ? 'log-warning'
                  : 'log-info'
              }`}
            >
              <div className="log-item-icon">{getEventIcon(ev.type)}</div>
              <span className="font-mono text-cyan" style={{ fontSize: '0.74rem', minWidth: '82px' }}>
                {ev.requestId}
              </span>
              <div style={{ display: 'inline-block' }}>{getEventBadge(ev.type)}</div>
              <span className="log-message font-mono" style={{ fontSize: '0.78rem' }}>
                {ev.message}
              </span>
              <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                Stock: {ev.stockRemaining}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
