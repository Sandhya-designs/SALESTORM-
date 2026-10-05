import React from 'react';
import type { ArchitectureComponentData, ArchitectureFlowMode } from '../../types';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Database,
  CheckCircle2,
  Server,
  Cloud,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ArchitectureDetailPanelProps {
  component: ArchitectureComponentData;
  activeFlowMode: ArchitectureFlowMode;
  onClose: () => void;
}

export const ArchitectureDetailPanel: React.FC<ArchitectureDetailPanelProps> = ({
  component,
  activeFlowMode,
  onClose,
}) => {
  const currentFlowRole = component.flowRoles[activeFlowMode];

  return (
    <div className="order-detail-backdrop" onClick={onClose}>
      <div
        className="order-detail-modal"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="order-detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className={`metric-icon-box ${
                component.isSimulatedInFlashGuard ? 'icon-cyan' : 'icon-purple'
              }`}
              style={{ width: '40px', height: '40px' }}
            >
              {component.isSimulatedInFlashGuard ? <Server size={22} /> : <Cloud size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {component.name}
                </h2>
                {component.isSimulatedInFlashGuard ? (
                  <span className="sample-badge badge-cyan">SIMULATED ENGINE</span>
                ) : (
                  <span className="sample-badge badge-dark">CONCEPTUAL PROD COMPONENT</span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{component.tierLabel}</span>
                <span>•</span>
                <span>Category: <strong>{component.category}</strong></span>
              </div>
            </div>
          </div>

          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="order-detail-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Active Flow Role Banner */}
          {currentFlowRole ? (
            <div className="result-callout result-success" style={{ margin: 0, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                <ArrowRight size={14} className="text-emerald" />
                <span>ROLE IN {activeFlowMode.replace('_', ' ')}:</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '4px' }}>
                {currentFlowRole}
              </div>
            </div>
          ) : (
            <div className="result-callout" style={{ margin: 0, padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Standby: Not actively modified in the {activeFlowMode.replace('_', ' ')} path.
              </span>
            </div>
          )}

          {/* Section 1: Responsibilities */}
          <div className="arch-detail-section">
            <div className="arch-section-title">
              <Layers size={14} className="text-cyan" />
              <span>RESPONSIBILITIES:</span>
            </div>
            <ul className="arch-bullets-list">
              {component.responsibilities.map((resp, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={13} className="text-cyan bullet-icon" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Data Managed */}
          <div className="arch-detail-section">
            <div className="arch-section-title">
              <Database size={14} className="text-emerald" />
              <span>DATA &amp; STATE MANAGED:</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {component.data.map((item, idx) => (
                <span key={idx} className="recovery-step-pill font-mono" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Critical Guarantee */}
          <div className="arch-detail-card guarantee-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <ShieldCheck size={16} className="text-emerald" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.5px' }}>
                CRITICAL GUARANTEE
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
              &ldquo;{component.criticalGuarantee}&rdquo;
            </div>
          </div>

          {/* Section 4: Failure Handling */}
          <div className="arch-detail-card failure-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <AlertTriangle size={16} className="text-rose" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f43f5e', letterSpacing: '0.5px' }}>
                FAILURE HANDLING &amp; RECOVERY
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              {component.failureHandling}
            </div>
          </div>

          {/* Section 5: Scaling Strategy */}
          <div className="arch-detail-card scaling-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <TrendingUp size={16} className="text-cyan" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.5px' }}>
                SCALING STRATEGY
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              {component.scaling}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
