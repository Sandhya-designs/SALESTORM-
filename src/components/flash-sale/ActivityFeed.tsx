import React from 'react';
import type { ActivityLog } from '../../types';
import { Terminal, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

interface ActivityFeedProps {
  logs: ActivityLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs }) => {
  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={14} className="text-emerald" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-amber" />;
      case 'alert':
        return <AlertOctagon size={14} className="text-cyan" />;
      case 'info':
      default:
        return <Info size={14} className="text-cyan" />;
    }
  };

  const getLogClass = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success':
        return 'log-success';
      case 'warning':
        return 'log-warning';
      case 'alert':
        return 'log-alert';
      case 'info':
      default:
        return 'log-info';
    }
  };

  return (
    <div className="activity-feed-card">
      <div className="activity-feed-header">
        <div className="activity-feed-title">
          <Terminal size={16} className="text-cyan" />
          <span>REAL-TIME AUDIT & EVENT LOG</span>
        </div>
        <div className="activity-feed-count font-mono">{logs.length} events logged</div>
      </div>

      <div className="activity-feed-body">
        {logs.map((log) => (
          <div key={log.id} className={`activity-log-item ${getLogClass(log.type)}`}>
            <div className="log-item-icon">{getLogIcon(log.type)}</div>
            <span className="log-timestamp font-mono">[{log.timestamp}]</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
