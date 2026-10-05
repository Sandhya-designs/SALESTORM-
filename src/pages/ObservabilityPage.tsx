import React from 'react';
import { useObservabilityStore } from '../hooks/useObservabilityStore';
import { ObservabilityMetricsGrid } from '../components/observability/ObservabilityMetricsGrid';
import { ObservabilityCharts } from '../components/observability/ObservabilityCharts';
import { TraceInspector } from '../components/observability/TraceInspector';
import { SystemHealthCard } from '../components/observability/SystemHealthCard';
import { SystemAlertsPanel } from '../components/observability/SystemAlertsPanel';
import { StatusBadge } from '../components/StatusBadge';
import { Activity, ShieldCheck, RefreshCw } from 'lucide-react';

export const ObservabilityPage: React.FC = () => {
  const { metrics, healthItems, alerts, traceSpans, chartData } = useObservabilityStore();

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Observability &amp; Telemetry
            </h1>
            <StatusBadge label="LIVE TELEMETRY STREAM" variant="cyan" pulse={true} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} className="text-cyan" />
            <span>Real-time flash sale telemetry, P95 latencies, distributed trace spans, and anomaly threshold alerts.</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge
            label="LOCAL SIMULATION METRICS"
            variant="dark"
            icon={<ShieldCheck size={13} className="text-cyan" />}
          />
          <StatusBadge
            label="INVARIANTS SATISFIED"
            variant="emerald"
            icon={<RefreshCw size={13} />}
          />
        </div>
      </div>

      {/* 1. All 12 Observability Metrics */}
      <ObservabilityMetricsGrid metrics={metrics} />

      {/* 2. Useful High-Impact Charts */}
      <ObservabilityCharts chartData={chartData} />

      {/* 3. Transaction Trace Inspector (Request ID -> Reservation ID -> Payment ID -> Order ID) */}
      <TraceInspector traces={traceSpans} />

      {/* 4. Bottom Grid: System Health & Active Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
        <SystemHealthCard healthItems={healthItems} />
        <SystemAlertsPanel alerts={alerts} />
      </div>
    </div>
  );
};
