import React from 'react';
import type {
  ArchitectureComponentData,
  ArchitectureComponentId,
  ArchitectureFlowMode,
} from '../../types';
import {
  ARCHITECTURE_COMPONENTS,
  FLOW_MODE_CONFIGS,
} from '../../data/architectureData';
import {
  Users,
  Globe,
  Shield,
  GitBranch,
  Cpu,
  Sliders,
  Package,
  ShoppingCart,
  Layers,
  Boxes,
  Clock,
  CreditCard,
  ShoppingBag,
  Truck,
  Bell,
  Database,
  HardDrive,
  Share2,
  Activity,
  ArrowRight,
  ArrowDown,
  Info,
} from 'lucide-react';

interface ArchitectureDiagramProps {
  currentMode: ArchitectureFlowMode;
  selectedComponent: ArchitectureComponentData | null;
  onSelectComponent: (comp: ArchitectureComponentData) => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  currentMode,
  selectedComponent,
  onSelectComponent,
}) => {
  const activeFlow = FLOW_MODE_CONFIGS[currentMode];

  const getComponentIcon = (id: ArchitectureComponentId) => {
    switch (id) {
      case 'customer':
        return <Users size={18} />;
      case 'cdn':
        return <Globe size={18} />;
      case 'waf':
        return <Shield size={18} />;
      case 'load_balancer':
        return <GitBranch size={18} />;
      case 'api_gateway':
        return <Cpu size={18} />;
      case 'rate_limiter':
        return <Sliders size={18} />;
      case 'product_service':
        return <Package size={18} />;
      case 'cart_service':
        return <ShoppingCart size={18} />;
      case 'checkout_service':
        return <Layers size={18} />;
      case 'inventory_service':
        return <Boxes size={18} />;
      case 'reservation_service':
        return <Clock size={18} />;
      case 'payment_service':
        return <CreditCard size={18} />;
      case 'order_service':
        return <ShoppingBag size={18} />;
      case 'shipment_service':
        return <Truck size={18} />;
      case 'notification_service':
        return <Bell size={18} />;
      case 'redis':
        return <Database size={18} />;
      case 'sql_database':
        return <HardDrive size={18} />;
      case 'message_broker':
        return <Share2 size={18} />;
      case 'observability':
        return <Activity size={18} />;
      default:
        return <Cpu size={18} />;
    }
  };

  const renderNode = (id: ArchitectureComponentId) => {
    const comp = ARCHITECTURE_COMPONENTS[id];
    if (!comp) return null;

    const isActiveInFlow = activeFlow.activeComponentIds.includes(id);
    const isSelected = selectedComponent?.id === id;
    const stepInFlow = activeFlow.stepSequence.find((s) => s.componentId === id);

    let nodeColorClass = 'node-idle';
    if (isActiveInFlow) {
      nodeColorClass = `node-active-${activeFlow.color}`;
    }

    return (
      <div
        key={id}
        className={`arch-node-box ${nodeColorClass} ${isSelected ? 'node-selected' : ''}`}
        onClick={() => onSelectComponent(comp)}
      >
        {/* Step indicator badge if in active flow */}
        {stepInFlow && (
          <div className={`node-step-badge badge-${activeFlow.color}`}>
            Step {stepInFlow.step}
          </div>
        )}

        <div className="arch-node-header">
          <div className={`arch-node-icon ${comp.isSimulatedInFlashGuard ? 'icon-cyan' : 'icon-muted'}`}>
            {getComponentIcon(id)}
          </div>
          <div className="arch-node-meta">
            <span className="arch-node-name font-mono">{comp.name}</span>
            <div className="arch-node-type-tags">
              {comp.isSimulatedInFlashGuard ? (
                <span className="arch-badge-simulated">SIMULATED</span>
              ) : (
                <span className="arch-badge-concept">CONCEPTUAL</span>
              )}
            </div>
          </div>
        </div>

        <div className="arch-node-guarantee font-mono">
          {comp.criticalGuarantee.length > 55
            ? `${comp.criticalGuarantee.substring(0, 52)}...`
            : comp.criticalGuarantee}
        </div>
      </div>
    );
  };

  return (
    <div className="traffic-table-card" style={{ padding: '20px', marginBottom: '24px' }}>
      {/* Top Banner Explaining Diagram & Interactivity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={15} className="text-cyan" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Interactive System Topology: Click any component to inspect responsibilities, data, guarantees, and failure strategies.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="arch-badge-simulated">FLASHGUARD SIMULATION ENGINE</span>
          <span className="arch-badge-concept">CONCEPTUAL PRODUCTION COMPONENT</span>
        </div>
      </div>

      <div className="arch-diagram-canvas">
        {/* ==========================================
            TIER 1: INGRESS & EDGE SHIELD PIPELINE
            Customer -> CDN -> WAF -> Load Balancer -> API Gateway -> Rate Limiter
           ========================================== */}
        <div className="arch-tier-block">
          <div className="arch-tier-title">
            <span>TIER 1: INGRESS &amp; TRAFFIC DEFENSE SHIELD</span>
          </div>

          <div className="arch-pipeline-row">
            {renderNode('customer')}
            <div className="arch-flow-arrow"><ArrowRight size={16} /></div>

            {renderNode('cdn')}
            <div className="arch-flow-arrow"><ArrowRight size={16} /></div>

            {renderNode('waf')}
            <div className="arch-flow-arrow"><ArrowRight size={16} /></div>

            {renderNode('load_balancer')}
            <div className="arch-flow-arrow"><ArrowRight size={16} /></div>

            {renderNode('api_gateway')}
            <div className="arch-flow-arrow"><ArrowRight size={16} /></div>

            {renderNode('rate_limiter')}
          </div>
        </div>

        {/* Downward Connector to Core Microservices */}
        <div className="arch-tier-connector">
          <div className="connector-line" />
          <div className="connector-arrow-box font-mono">
            <ArrowDown size={14} />
            <span>DISPATCH TO DOMAIN SERVICES</span>
            <ArrowDown size={14} />
          </div>
          <div className="connector-line" />
        </div>

        {/* ==========================================
            TIER 2: CORE MICROSERVICES LAYER (3 SWIMLANES)
           ========================================== */}
        <div className="arch-tier-block">
          <div className="arch-tier-title">
            <span>TIER 2: CORE MICROSERVICES &amp; CONSISTENCY ENGINES</span>
          </div>

          <div className="arch-services-grid">
            {/* Swimlane A: Catalog & Cart */}
            <div className="arch-swimlane">
              <div className="arch-swimlane-header font-mono">
                CATALOG &amp; SESSION DOMAIN
              </div>
              <div className="arch-swimlane-nodes">
                {renderNode('product_service')}
                {renderNode('cart_service')}
                {renderNode('checkout_service')}
              </div>
            </div>

            {/* Swimlane B: Core Consistency Engines (Simulated) */}
            <div className="arch-swimlane highlight-lane">
              <div className="arch-swimlane-header font-mono text-cyan" style={{ borderBottomColor: 'rgba(56, 189, 248, 0.3)' }}>
                ★ FLASH SALE CONCURRENCY CORE (SIMULATED)
              </div>
              <div className="arch-swimlane-nodes">
                {renderNode('reservation_service')}
                {renderNode('inventory_service')}
                {renderNode('payment_service')}
              </div>
            </div>

            {/* Swimlane C: Fulfillment & Communications */}
            <div className="arch-swimlane">
              <div className="arch-swimlane-header font-mono">
                FULFILLMENT &amp; NOTIFICATIONS
              </div>
              <div className="arch-swimlane-nodes">
                {renderNode('order_service')}
                {renderNode('shipment_service')}
                {renderNode('notification_service')}
              </div>
            </div>
          </div>
        </div>

        {/* Downward Connector to Infrastructure Tier */}
        <div className="arch-tier-connector">
          <div className="connector-line" />
          <div className="connector-arrow-box font-mono">
            <ArrowDown size={14} />
            <span>DATA STORAGE &amp; EVENT BUS</span>
            <ArrowDown size={14} />
          </div>
          <div className="connector-line" />
        </div>

        {/* ==========================================
            TIER 3: SHARED INFRASTRUCTURE & DATA PLANE
            Redis, SQL Database, Message Broker, Observability
           ========================================== */}
        <div className="arch-tier-block">
          <div className="arch-tier-title">
            <span>TIER 3: SHARED INFRASTRUCTURE &amp; TELEMETRY BACKPLANE</span>
          </div>

          <div className="arch-infra-grid">
            {renderNode('redis')}
            {renderNode('sql_database')}
            {renderNode('message_broker')}
            {renderNode('observability')}
          </div>
        </div>
      </div>
    </div>
  );
};
