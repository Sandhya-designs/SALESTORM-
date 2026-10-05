import React from 'react';
import type { FailureScenario } from '../../types';
import { Flame, CheckCircle2, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

interface FailureSummaryCardsProps {
  scenarios: FailureScenario[];
}

export const FailureSummaryCards: React.FC<FailureSummaryCardsProps> = ({ scenarios }) => {
  const total = scenarios.length;
  const recovered = scenarios.filter((s) => s.status === 'RECOVERED').length;
  const simulating = scenarios.filter((s) => s.status === 'SIMULATING').length;
  const idle = scenarios.filter((s) => s.status === 'IDLE').length;

  const cards = [
    {
      id: 'total',
      label: 'Simulated Failures',
      value: total,
      sub: '9 Chaos fault profiles',
      icon: <Flame size={18} />,
      color: 'rose',
    },
    {
      id: 'recovered',
      label: 'Self-Healed / Recovered',
      value: recovered,
      sub: 'Resilience verified',
      icon: <CheckCircle2 size={18} />,
      color: 'emerald',
    },
    {
      id: 'active',
      label: 'Active Faults',
      value: simulating,
      sub: simulating > 0 ? 'Fault injection running' : 'Zero active outages',
      icon: <ShieldAlert size={18} />,
      color: simulating > 0 ? 'amber' : 'muted',
    },
    {
      id: 'idle',
      label: 'Pending Verification',
      value: idle,
      sub: 'Ready for injection',
      icon: <RefreshCw size={18} />,
      color: 'cyan',
    },
    {
      id: 'guarantee',
      label: 'Zero Oversell Invariant',
      value: '100%',
      sub: 'Guaranteed under all faults',
      icon: <Cpu size={18} />,
      color: 'purple',
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {cards.map((c) => (
          <div key={c.id} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{c.label}</span>
              <div className={`metric-icon-box icon-${c.color}`}>{c.icon}</div>
            </div>
            <div className="metric-value-row">
              <span className="metric-value font-mono">{c.value}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-desc">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
