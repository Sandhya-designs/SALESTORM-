import React from 'react';
import { StatusBadge } from './StatusBadge';
import { ShieldAlert, Laptop, Cpu } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <h1>
          <span>FlashGuard</span>
          <StatusBadge label="PHASES 1-9 COMPLETE" variant="cyan" />
        </h1>
        <p className="topbar-subtitle">Consistency-First Flash Sale Simulation</p>
      </div>

      <div className="topbar-actions">
        <StatusBadge
          label="SYSTEM READY"
          variant="emerald"
          pulse={true}
          icon={<Cpu size={13} />}
        />
        <StatusBadge
          label="LOCAL SIMULATION"
          variant="dark"
          icon={<Laptop size={13} />}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <ShieldAlert size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>SALESTORM 2026</span>
        </div>
      </div>
    </header>
  );
};
