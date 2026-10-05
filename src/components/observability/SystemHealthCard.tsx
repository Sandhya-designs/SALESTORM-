import React from 'react';
import type { ServiceHealthItem } from '../../types';
import { Server, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface SystemHealthCardProps {
  healthItems: ServiceHealthItem[];
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ healthItems }) => {
  const getStatusBadge = (status: ServiceHealthItem['status']) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="sample-badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={11} /> HEALTHY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="sample-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> DEGRADED
          </span>
        );
      case 'DOWN':
      default:
        return (
          <span className="sample-badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={11} /> DOWN
          </span>
        );
    }
  };

  return (
    <div className="traffic-table-card" style={{ padding: '16px', height: '100%' }}>
      <div className="traffic-table-header" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={16} className="text-emerald" />
          <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
            SYSTEM &amp; INFRASTRUCTURE HEALTH
          </span>
        </div>
        <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
          Real-time cluster status
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {healthItems.map((svc) => (
          <div
            key={svc.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                  {svc.name}
                </span>
                <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                  {svc.latencyMs > 0 ? `${svc.latencyMs}ms` : 'Offline'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {svc.details}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                {svc.uptime}
              </span>
              {getStatusBadge(svc.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
