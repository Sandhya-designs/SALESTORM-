import React, { useState } from 'react';
import type { FailureLogEntry } from '../../types';
import { Terminal, Trash2, Search, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface FailureTimelineLogProps {
  logs: FailureLogEntry[];
  onClear: () => void;
}

export const FailureTimelineLog: React.FC<FailureTimelineLogProps> = ({ logs, onClear }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = searchTerm
    ? logs.filter(
        (l) =>
          l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.serviceTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.timeStr.includes(searchTerm)
      )
    : logs;

  const getSeverityIcon = (sev: FailureLogEntry['severity']) => {
    switch (sev) {
      case 'SUCCESS':
        return <CheckCircle2 size={13} className="text-emerald" />;
      case 'ERROR':
        return <AlertTriangle size={13} className="text-rose" />;
      case 'WARN':
        return <AlertTriangle size={13} className="text-amber" />;
      case 'INFO':
      default:
        return <Info size={13} className="text-cyan" />;
    }
  };

  return (
    <div className="traffic-table-card">
      <div className="traffic-table-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} className="text-cyan" />
          <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.5px' }}>
            FAILURE &amp; RECOVERY TIMELINE LOG
          </span>
          <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
            ({logs.length} events recorded)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="res-search-box" style={{ maxWidth: '240px', padding: '4px 8px' }}>
            <Search size={13} className="text-muted" />
            <input
              type="text"
              className="res-search-input"
              placeholder="Filter timeline log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '0.74rem' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClear}
            title="Clear timeline log"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <Trash2 size={12} />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="failure-log-feed">
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No failure timeline events recorded yet. Trigger a simulated failure above to view real-time architectural recovery events.
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div key={entry.id} className={`failure-log-row sev-${entry.severity.toLowerCase()}`}>
              <div className="failure-log-time font-mono">{entry.timeStr}</div>
              <div className="failure-log-tag">
                <span className={`tag-pill tag-${entry.serviceTag.toLowerCase()}`}>
                  {entry.serviceTag}
                </span>
              </div>
              <div className="failure-log-icon">{getSeverityIcon(entry.severity)}</div>
              <div className="failure-log-message font-mono">{entry.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
