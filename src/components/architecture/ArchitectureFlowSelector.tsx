import React from 'react';
import type { ArchitectureFlowMode } from '../../types';
import { FLOW_MODE_CONFIGS } from '../../data/architectureData';
import { Activity, ArrowRight, Play } from 'lucide-react';

interface ArchitectureFlowSelectorProps {
  currentMode: ArchitectureFlowMode;
  onSelectMode: (mode: ArchitectureFlowMode) => void;
}

export const ArchitectureFlowSelector: React.FC<ArchitectureFlowSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const activeConfig = FLOW_MODE_CONFIGS[currentMode];

  const modes: ArchitectureFlowMode[] = [
    'NORMAL_FLOW',
    'PURCHASE_FLOW',
    'PAYMENT_FAILURE',
    'ORDER_FAILURE',
    'RESERVATION_EXPIRY',
  ];

  return (
    <div className="tester-panel-card" style={{ marginBottom: '22px' }}>
      <div className="tester-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} className="text-cyan" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.5px' }}>
            ARCHITECTURE FLOW MODES (SYSTEM VISUALIZATION)
          </span>
        </div>

        {/* 5 Flow Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {modes.map((m) => {
            const cfg = FLOW_MODE_CONFIGS[m];
            const isActive = currentMode === m;
            return (
              <button
                key={m}
                type="button"
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSelectMode(m)}
                style={{
                  fontSize: '0.76rem',
                  padding: '6px 14px',
                  fontWeight: 700,
                  borderColor: isActive
                    ? cfg.color === 'emerald'
                      ? 'var(--accent-emerald)'
                      : cfg.color === 'rose'
                      ? '#f43f5e'
                      : cfg.color === 'purple'
                      ? 'var(--accent-purple)'
                      : cfg.color === 'amber'
                      ? 'var(--accent-amber)'
                      : 'var(--accent-cyan)'
                    : undefined,
                }}
              >
                <Play size={11} fill={isActive ? 'currentColor' : 'none'} />
                <span>{cfg.name.split(' (')[0].toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Flow Explainer Box */}
      <div className={`result-callout ${activeConfig.color === 'emerald' ? 'result-success' : activeConfig.color === 'rose' ? 'result-error' : 'result-warning'}`} style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
              {activeConfig.name}
            </span>
            <span className={`sample-badge ${activeConfig.color === 'emerald' ? 'badge-emerald' : activeConfig.color === 'rose' ? 'badge-danger' : activeConfig.color === 'purple' ? 'badge-purple' : 'badge-cyan'}`}>
              {activeConfig.badge}
            </span>
          </div>
          <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
            {activeConfig.activeComponentIds.length} components highlighted in this execution path
          </span>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', lineHeight: 1.4, marginBottom: '10px' }}>
          {activeConfig.description}
        </div>

        {/* Step Sequence Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
            FLOW PATH:
          </span>
          {activeConfig.stepSequence.map((step, idx) => (
            <React.Fragment key={step.step}>
              <div
                className="step-sequence-pill font-mono"
                title={step.action}
              >
                <span className="step-num">{step.step}</span>
                <span className="step-name">{step.componentId.replace('_', ' ')}</span>
              </div>
              {idx < activeConfig.stepSequence.length - 1 && (
                <ArrowRight size={12} className="text-muted" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
