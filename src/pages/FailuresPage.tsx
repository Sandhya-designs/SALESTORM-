import React from 'react';
import { useFailureSimulationStore } from '../hooks/useFailureSimulationStore';
import { FailureSummaryCards } from '../components/failures/FailureSummaryCards';
import { OrderServiceOutboxDemo } from '../components/failures/OrderServiceOutboxDemo';
import { DuplicateRequestDemo } from '../components/failures/DuplicateRequestDemo';
import { FailureScenariosGrid } from '../components/failures/FailureScenariosGrid';
import { FailureTimelineLog } from '../components/failures/FailureTimelineLog';
import { StatusBadge } from '../components/StatusBadge';
import { Flame, RefreshCw, Play, ShieldAlert, AlertTriangle } from 'lucide-react';

export const FailuresPage: React.FC = () => {
  const {
    scenarios,
    logs,
    outboxSteps,
    duplicateDemoState,
    triggerScenario,
    triggerAllScenarios,
    runOrderServiceDown,
    runDuplicatePurchaseRequest,
    runMessageDuplication,
    clearLogs,
    resetAllScenarios,
  } = useFailureSimulationStore();

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Failure Simulation Control Center
            </h1>
            <StatusBadge label="CHAOS SIMULATION ACTIVE" variant="rose" pulse={true} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={14} className="text-rose" />
            <span>Interactive fault injection verifying self-healing, transactional outbox retries, and idempotency guards.</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetAllScenarios}
            title="Reset all failure states and logs"
          >
            <RefreshCw size={14} />
            <span>RESET SIMULATOR</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={triggerAllScenarios}
            style={{ backgroundColor: '#f43f5e', borderColor: '#f43f5e', color: '#ffffff' }}
          >
            <Play size={14} fill="currentColor" />
            <span>TRIGGER ALL SIMULATED FAILURES</span>
          </button>
          <StatusBadge
            label="SIMULATED FAILURE MODE"
            variant="amber"
            icon={<ShieldAlert size={13} />}
          />
        </div>
      </div>

      {/* Mandatory Simulated Failure Notice Banner */}
      <div className="simulated-gateway-badge-banner" style={{ borderColor: 'rgba(244, 63, 94, 0.35)', backgroundColor: 'rgba(244, 63, 94, 0.05)', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} className="text-rose" />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
            <strong className="text-rose">[SIMULATED FAILURE]</strong> All 9 failure modes below are local simulated scenarios designed to visually demonstrate the FlashGuard architecture's recovery strategies, outbox retry pipelines, and idempotency filters.
          </div>
        </div>
        <span className="sample-badge badge-danger">SIMULATION ONLY • ZERO REAL DOWNTIME</span>
      </div>

      {/* 1. Summary Cards */}
      <FailureSummaryCards scenarios={scenarios} />

      {/* 2. Order Service Down & Transactional Outbox Flow (Special Highlight) */}
      <OrderServiceOutboxDemo
        outboxSteps={outboxSteps}
        onTrigger={runOrderServiceDown}
      />

      {/* 3. Duplicate Request & Duplicate Event Idempotency Sandbox */}
      <DuplicateRequestDemo
        duplicateState={duplicateDemoState}
        onTriggerDuplicateRequest={runDuplicatePurchaseRequest}
        onTriggerDuplicateEvent={runMessageDuplication}
      />

      {/* 4. Failure Simulation Control Center (9 Scenarios) */}
      <FailureScenariosGrid
        scenarios={scenarios}
        onTrigger={triggerScenario}
      />

      {/* 5. Chronological Failure & Recovery Timeline Log */}
      <FailureTimelineLog
        logs={logs}
        onClear={clearLogs}
      />
    </div>
  );
};
