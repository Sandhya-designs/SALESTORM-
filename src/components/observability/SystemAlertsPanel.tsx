import React from 'react';
import type { SystemAlert } from '../../types';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface SystemAlertsPanelProps {
  alerts: SystemAlert[];
}

export const SystemAlertsPanel: React.FC<SystemAlertsPanelProps> = ({ alerts }) => {
  const getAlertIcon = (lvl: SystemAlert['level']) => {
    switch (lvl) {
      case 'CRITICAL':
        return <AlertCircle size={15} className="text-rose" />;
      case 'WARNING':
        return <AlertTriangle size={15} className="text-amber" />;
      case 'INFO':
      default:
        return <Info size={15} className="text-cyan" />;
    }
  };

  return (
    <div className="traffic-table-card" style={{ padding: '16px', height: '100%' }}>
      <div className="traffic-table-header" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} className="text-amber" />
          <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
            ACTIVE SYSTEM ANOMALY ALERTS
          </span>
          <span className="sample-badge badge-amber" style={{ fontSize: '0.65rem' }}>
            {alerts.length} ALERTS
          </span>
        </div>
        <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
          Threshold monitoring
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <CheckCircle2 size={24} className="text-emerald" />
            </div>
            All systems nominal. Zero threshold violations or active alerts detected.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`result-callout ${
                alert.level === 'CRITICAL'
                  ? 'result-error'
                  : alert.level === 'WARNING'
                  ? 'result-warning'
                  : 'result-success'
              }`}
              style={{ margin: 0, padding: '10px 14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getAlertIcon(alert.level)}
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#ffffff' }}>
                    {alert.title}
                  </span>
                </div>
                <span className="font-mono text-muted" style={{ fontSize: '0.68rem' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', lineHeight: 1.35, paddingLeft: '21px' }}>
                {alert.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
