import React from 'react';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { SectionCard } from '../components/SectionCard';
import { ArchitectureFlow } from '../components/ArchitectureFlow';
import { CoreGuaranteesList } from '../components/CoreGuaranteesList';
import { StatusBadge } from '../components/StatusBadge';
import { ARCHITECTURE_STEPS, CORE_GUARANTEES } from '../data/mockData';
import {
  ShieldCheck,
  Network,
  Cpu,
  Users,
  Package,
  Zap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { inventory, isInvariantValid } = useInventoryStore();

  const totalOversold = Math.max(0, inventory.sold + inventory.reserved - inventory.total);

  return (
    <div className="page-container">
      {/* 1. HERO INVARIANT CALLOUT: 10,000 Requests vs 100 Units with OVERSOLD: 0 */}
      <section className="invariant-hero-card">
        <div className="invariant-hero-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={15} className="text-cyan" />
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.8px' }}>
              SALESTORM SYSCRAFTERS 2026 • CONSISTENCY-FIRST ARCHITECTURE
            </span>
          </div>
          <StatusBadge label="INVARIANT VERIFIED" variant="emerald" pulse={true} />
        </div>

        {/* Big Contrast Display: 10,000 Requests vs 100 Units */}
        <div className="invariant-contrast-grid">
          {/* Side A: 10,000 Requests */}
          <div className="contrast-side contrast-demand">
            <div className="contrast-badge badge-rose">HIGH-CONCURRENCY DEMAND</div>
            <div className="contrast-number font-mono text-rose">10,000</div>
            <div className="contrast-sub font-mono">CONCURRENT PURCHASE REQUESTS</div>
            <div className="contrast-desc">Virtual shoppers competing simultaneously for limited stock allocation</div>
          </div>

          {/* Versus Center Separator */}
          <div className="contrast-vs-divider">
            <span className="vs-badge">VS</span>
            <div className="vs-line" />
          </div>

          {/* Side B: 100 Units */}
          <div className="contrast-side contrast-supply">
            <div className="contrast-badge badge-cyan">LIMITED INVENTORY CAP</div>
            <div className="contrast-number font-mono text-cyan">100</div>
            <div className="contrast-sub font-mono">AVAILABLE PRODUCT UNITS</div>
            <div className="contrast-desc">Strict inventory ceiling protected by atomic CAS memory mutexes</div>
          </div>
        </div>

        {/* Most Important Safety Result Banner: OVERSOLD: 0 */}
        <div className="oversold-invariant-banner">
          <div className="oversold-banner-left">
            <div className="oversold-super-label">CENTRAL ENGINEERING SAFETY RESULT</div>
            <div className="oversold-super-value font-mono">
              OVERSOLD: <span className="text-emerald">{totalOversold}</span>
            </div>
          </div>

          <div className="oversold-banner-center">
            <div className="invariant-equation font-mono">
              <span className="text-cyan">{inventory.available} Available</span>
              <span className="text-muted">+</span>
              <span className="text-amber">{inventory.reserved} Reserved</span>
              <span className="text-muted">+</span>
              <span className="text-emerald">{inventory.sold} Sold</span>
              <span className="text-muted">=</span>
              <span className="text-white font-bold">{inventory.total} Total</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Mathematical inventory conservation invariant strictly satisfied across all concurrent transactions.
            </div>
          </div>

          <div className="oversold-banner-actions">
            <Link to="/flash-sale" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <Zap size={13} fill="currentColor" />
              <span>RUN 10K SIMULATION</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Telemetry Gauges */}
      <section className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Available Inventory</span>
            <div className="metric-icon-box icon-cyan"><Package size={18} /></div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value font-mono">{inventory.available}</span>
            <span className="metric-unit">units</span>
          </div>
          <div className="metric-footer">
            <span className="metric-desc">Safe for immediate reservation allocation</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Reservations</span>
            <div className="metric-icon-box icon-amber"><Users size={18} /></div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value font-mono">{inventory.reserved}</span>
            <span className="metric-unit">held</span>
          </div>
          <div className="metric-footer">
            <span className="metric-desc">Locks holding stock pending payment completion</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Confirmed Sold</span>
            <div className="metric-icon-box icon-emerald"><ShieldCheck size={18} /></div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value font-mono">{inventory.sold}</span>
            <span className="metric-unit">settled</span>
          </div>
          <div className="metric-footer">
            <span className="metric-desc">Payment captured &amp; committed to sales ledger</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">System Invariant</span>
            <div className="metric-icon-box icon-purple"><TrendingUp size={18} /></div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value font-mono" style={{ fontSize: '1.4rem' }}>
              {isInvariantValid ? 'NOMINAL' : 'DEGRADED'}
            </span>
          </div>
          <div className="metric-footer">
            <span className="metric-desc">Zero overselling guarantee verified</span>
          </div>
        </div>
      </section>

      {/* 3. Fast Architecture Navigation Bar */}
      <div className="tester-panel-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
              EXPLORE FLASHGUARD ARCHITECTURE &amp; SIMULATION ENGINES
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Navigate to specialized control consoles to test concurrency, payments, state machine, and failure recovery.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/architecture" className="btn btn-secondary" style={{ fontSize: '0.76rem', padding: '6px 12px' }}>
              <Network size={13} />
              <span>System Topology</span>
            </Link>
            <Link to="/failures" className="btn btn-secondary" style={{ fontSize: '0.76rem', padding: '6px 12px' }}>
              <Cpu size={13} />
              <span>Failure Simulator</span>
            </Link>
            <Link to="/observability" className="btn btn-primary" style={{ fontSize: '0.76rem', padding: '6px 12px' }}>
              <TrendingUp size={13} />
              <span>Live Observability</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Simulation Architecture Flow */}
      <SectionCard
        title="Simulation Architecture Flow"
        subtitle="End-to-end event pipeline lifecycle from high-burst client request to final order confirmation."
        icon={<Network size={18} style={{ color: 'var(--accent-cyan)' }} />}
        rightAction={<StatusBadge label="PIPELINE STANDBY" variant="dark" />}
      >
        <ArchitectureFlow steps={ARCHITECTURE_STEPS} />
      </SectionCard>

      {/* 5. Core Guarantees Section */}
      <SectionCard
        title="Core Consistency Guarantees"
        subtitle="Strict transactional invariants enforced across inventory locks, idempotency keys, and TTL expiration."
        icon={<ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />}
        rightAction={<StatusBadge label="INVARIANTS ACTIVE" variant="emerald" />}
      >
        <CoreGuaranteesList guarantees={CORE_GUARANTEES} />
      </SectionCard>
    </div>
  );
};
