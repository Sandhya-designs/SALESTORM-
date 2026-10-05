import React, { useState } from 'react';
import type { FailureCategory, FailureScenario, FailureScenarioId } from '../../types';
import { Play, CheckCircle2, RefreshCw, Flame, ArrowRight, ShieldCheck } from 'lucide-react';

interface FailureScenariosGridProps {
  scenarios: FailureScenario[];
  onTrigger: (id: FailureScenarioId) => void;
}

export const FailureScenariosGrid: React.FC<FailureScenariosGridProps> = ({
  scenarios,
  onTrigger,
}) => {
  const [filter, setFilter] = useState<FailureCategory | 'ALL'>('ALL');

  const filtered = filter === 'ALL'
    ? scenarios
    : scenarios.filter((s) => s.category === filter);

  const getStatusBadge = (status: FailureScenario['status']) => {
    switch (status) {
      case 'SIMULATING':
        return (
          <span className="sample-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={10} className="animate-spin" /> SIMULATING
          </span>
        );
      case 'RECOVERED':
        return (
          <span className="sample-badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={10} /> RECOVERED
          </span>
        );
      case 'FAILED':
        return <span className="sample-badge badge-danger">FAILED</span>;
      case 'IDLE':
      default:
        return <span className="sample-badge badge-dark">IDLE / UNTESTED</span>;
    }
  };

  const getCategoryBadge = (category: FailureCategory) => {
    switch (category) {
      case 'PAYMENT':
        return <span className="sample-badge badge-emerald">PAYMENT</span>;
      case 'ORDER':
        return <span className="sample-badge badge-purple">ORDER</span>;
      case 'CONCURRENCY':
        return <span className="sample-badge badge-cyan">CONCURRENCY</span>;
      case 'EVENT':
        return <span className="sample-badge badge-amber">EVENT</span>;
      case 'INFRASTRUCTURE':
        return <span className="sample-badge badge-danger">INFRASTRUCTURE</span>;
      case 'INVENTORY':
      default:
        return <span className="sample-badge badge-cyan">INVENTORY</span>;
    }
  };

  return (
    <div className="traffic-table-card" style={{ marginBottom: '24px' }}>
      <div className="traffic-table-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} className="text-rose" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            FAILURE SIMULATION CONTROL CENTER (9 FAULT PROFILES)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="res-filter-pills">
          {(['ALL', 'PAYMENT', 'ORDER', 'CONCURRENCY', 'EVENT', 'INFRASTRUCTURE', 'INVENTORY'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Failure Scenario Cards */}
      <div className="failure-cards-grid">
        {filtered.map((sc) => {
          const isSimulating = sc.status === 'SIMULATING';

          return (
            <div key={sc.id} className={`failure-scenario-card status-${sc.status.toLowerCase()}`}>
              {/* Card Top: Badges & Trigger */}
              <div className="failure-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {getCategoryBadge(sc.category)}
                  <span className="sample-badge badge-danger">SIMULATED FAILURE</span>
                  {getStatusBadge(sc.status)}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onTrigger(sc.id)}
                  disabled={isSimulating}
                  style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw size={11} className="animate-spin" />
                      <span>INJECTING...</span>
                    </>
                  ) : (
                    <>
                      <Play size={11} fill="currentColor" />
                      <span>TRIGGER</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title & Description */}
              <div style={{ marginTop: '10px' }}>
                <h3 className="failure-card-title font-mono">{sc.name}</h3>
                <p className="failure-card-desc">{sc.description}</p>
              </div>

              {/* Expected Recovery */}
              <div className="failure-recovery-box">
                <div className="failure-recovery-header">
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    EXPECTED RECOVERY FLOW:
                  </span>
                </div>
                <div className="recovery-flow-pills">
                  {sc.recoveryFlow.map((step, idx) => (
                    <React.Fragment key={step}>
                      <span className="recovery-step-pill font-mono">{step}</span>
                      {idx < sc.recoveryFlow.length - 1 && (
                        <ArrowRight size={12} className="text-muted" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Actual Result */}
              <div className="failure-result-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={13} className={sc.actualResult ? 'text-emerald' : 'text-muted'} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ACTUAL RESULT:
                  </span>
                </div>
                <div className="failure-result-text font-mono">
                  {sc.actualResult ? sc.actualResult : 'Awaiting trigger execution to evaluate system resilience...'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
