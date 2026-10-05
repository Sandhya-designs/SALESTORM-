import React, { useState } from 'react';
import { ArchitectureFlowSelector } from '../components/architecture/ArchitectureFlowSelector';
import { ArchitectureDiagram } from '../components/architecture/ArchitectureDiagram';
import { ArchitectureDetailPanel } from '../components/architecture/ArchitectureDetailPanel';
import { StatusBadge } from '../components/StatusBadge';
import { ARCHITECTURE_COMPONENTS } from '../data/architectureData';
import type { ArchitectureComponentData, ArchitectureFlowMode } from '../types';
import { Network, Server, RefreshCw } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ArchitectureFlowMode>('PURCHASE_FLOW');
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentData | null>(
    ARCHITECTURE_COMPONENTS['inventory_service'] // Default to Inventory Service for quick inspection
  );

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              System Architecture Topology
            </h1>
            <StatusBadge label="INTERACTIVE VISUAL DIAGRAM" variant="cyan" pulse={true} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Network size={14} className="text-cyan" />
            <span>End-to-end distributed system topology illustrating ingress shields, consistency engines, and failure recovery paths.</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setCurrentMode('PURCHASE_FLOW');
              setSelectedComponent(ARCHITECTURE_COMPONENTS['inventory_service']);
            }}
            title="Reset flow mode and inspection panel"
          >
            <RefreshCw size={14} />
            <span>DEFAULT SAGA VIEW</span>
          </button>
          <StatusBadge
            label="CONSISTENCY-FIRST DESIGN"
            variant="emerald"
            icon={<Server size={13} />}
          />
        </div>
      </div>

      {/* 1. Flow Mode Selector (Normal Flow, Purchase Flow, Payment Failure, Order Failure, Reservation Expiry) */}
      <ArchitectureFlowSelector
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
      />

      {/* 2. Main Architecture Diagram (Customer -> CDN -> WAF -> LB -> Gateway -> Limiter -> Services -> Infra) */}
      <ArchitectureDiagram
        currentMode={currentMode}
        selectedComponent={selectedComponent}
        onSelectComponent={(comp) => setSelectedComponent(comp)}
      />

      {/* 3. Detail Inspection Panel (Opened when a component is clicked) */}
      {selectedComponent && (
        <ArchitectureDetailPanel
          component={selectedComponent}
          activeFlowMode={currentMode}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
};
