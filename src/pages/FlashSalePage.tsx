import React, { useState } from 'react';
import { useTenThousandSimulation } from '../hooks/useTenThousandSimulation';
import { useFlashSaleSimulation } from '../hooks/useFlashSaleSimulation';
import { StatusBadge } from '../components/StatusBadge';
import { TenThousandSimulationPanel } from '../components/simulation/TenThousandSimulationPanel';
import { SimulationResultsGrid } from '../components/simulation/SimulationResultsGrid';
import { SimulationPipelineVisualization } from '../components/simulation/SimulationPipelineVisualization';
import { InventorySafetyValidationPanel } from '../components/simulation/InventorySafetyValidationPanel';
import { SimulationLiveEventFeed } from '../components/simulation/SimulationLiveEventFeed';
import { FlashSaleConfigPanel } from '../components/flash-sale/FlashSaleConfigPanel';
import { Zap, ShieldCheck, Laptop, Cpu, Settings2 } from 'lucide-react';

export const FlashSalePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'10k_SIMULATION' | 'CONFIG_PANEL'>('10k_SIMULATION');

  // Phase 4 Central 10,000 Request Simulation Engine
  const {
    stats,
    safetyChecks,
    liveEvents,
    progressPercent,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
  } = useTenThousandSimulation();

  // Phase 2 Interactive Parameter Controls
  const {
    config,
    status: mockStatus,
    startSimulation: startMock,
    pauseSimulation: pauseMock,
    resetSimulation: resetMock,
    updateSpeed,
  } = useFlashSaleSimulation();

  const getStatusBadge = () => {
    switch (stats.status) {
      case 'RUNNING':
        return <StatusBadge label="PROCESSING 10K BURST" variant="cyan" pulse={true} />;
      case 'PAUSED':
        return <StatusBadge label="SIMULATION PAUSED" variant="amber" />;
      case 'COMPLETED':
        return <StatusBadge label="SIMULATION COMPLETED" variant="emerald" />;
      case 'IDLE':
      default:
        return <StatusBadge label="SALE READY" variant="emerald" pulse={true} />;
    }
  };

  return (
    <div className="page-container">
      {/* Top Header Bar */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Flash Sale Control Center
            </h1>
            {getStatusBadge()}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} className="text-cyan" />
            <span>High-Scale Flash Sale Simulation: <strong>10,000 customers competing for 100 units</strong></span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge
            label="LOCAL CONCURRENCY SIMULATION"
            variant="dark"
            icon={<Laptop size={13} className="text-cyan" />}
          />
          <StatusBadge
            label="CONSISTENCY-FIRST"
            variant="emerald"
            icon={<ShieldCheck size={13} />}
          />
        </div>
      </div>

      {/* Mode Toggle Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`filter-pill ${activeTab === '10k_SIMULATION' ? 'active' : ''}`}
          onClick={() => setActiveTab('10k_SIMULATION')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.82rem' }}
        >
          <Cpu size={14} />
          <span>10,000 REQUEST STRESS SIMULATION (PHASE 4)</span>
        </button>

        <button
          type="button"
          className={`filter-pill ${activeTab === 'CONFIG_PANEL' ? 'active' : ''}`}
          onClick={() => setActiveTab('CONFIG_PANEL')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.82rem' }}
        >
          <Settings2 size={14} />
          <span>SIMULATION PARAMETERS</span>
        </button>
      </div>

      {activeTab === 'CONFIG_PANEL' && (
        <FlashSaleConfigPanel
          config={config}
          status={mockStatus}
          onStart={startMock}
          onPause={pauseMock}
          onReset={resetMock}
          onSpeedChange={updateSpeed}
        />
      )}

      {/* Main 10,000 Simulation Control Panel */}
      <TenThousandSimulationPanel
        stats={stats}
        progressPercent={progressPercent}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onResume={resumeSimulation}
        onReset={resetSimulation}
      />

      {/* 6 Required Simulation Results Metrics */}
      <SimulationResultsGrid stats={stats} />

      {/* Concurrency Pipeline Visualization & Large OVERSOLD: 0 indicator */}
      <SimulationPipelineVisualization stats={stats} />

      {/* Two-column layout for Inventory Safety Checks & Scrolling Event Feed */}
      <div className="flash-details-grid" style={{ alignItems: 'start' }}>
        {/* Safety Validation Panel (5 checks turning green) */}
        <InventorySafetyValidationPanel checks={safetyChecks} />

        {/* Live Scrolling Event Feed */}
        <SimulationLiveEventFeed
          events={liveEvents}
          isRunning={stats.status === 'RUNNING'}
        />
      </div>
    </div>
  );
};
