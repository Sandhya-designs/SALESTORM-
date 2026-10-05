import React from 'react';
import type { ProductInventory } from '../../types';
import { Package, CheckCircle2, Clock, ShoppingCart, ShieldCheck } from 'lucide-react';

interface InventorySummaryCardsProps {
  inventory: ProductInventory;
  isInvariantValid: boolean;
}

export const InventorySummaryCards: React.FC<InventorySummaryCardsProps> = ({
  inventory,
  isInvariantValid,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Inventory',
      value: inventory.total,
      unit: 'units',
      sub: 'Allocated pool limit',
      icon: <Package size={18} />,
      color: 'cyan',
    },
    {
      id: 'available',
      label: 'Available Stock',
      value: inventory.available,
      unit: 'units',
      sub: 'Ready for atomic lock',
      icon: <CheckCircle2 size={18} />,
      color: 'emerald',
    },
    {
      id: 'reserved',
      label: 'Reserved Stock',
      value: inventory.reserved,
      unit: 'units',
      sub: 'Held under TTL lock',
      icon: <Clock size={18} />,
      color: 'amber',
    },
    {
      id: 'sold',
      label: 'Sold Units',
      value: inventory.sold,
      unit: 'units',
      sub: 'Confirmed purchases',
      icon: <ShoppingCart size={18} />,
      color: 'purple',
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="metrics-grid">
        {cards.map((c) => (
          <div key={c.id} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{c.label}</span>
              <div className={`metric-icon-box icon-${c.color}`}>{c.icon}</div>
            </div>
            <div className="metric-value-row">
              <span className="metric-value">{c.value}</span>
              <span className="metric-unit">{c.unit}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-desc">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Invariant Equation Verification Banner */}
      <div className="invariant-check-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck
            size={18}
            className={isInvariantValid ? 'text-emerald' : 'text-amber'}
          />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.5px' }}>
            CONSERVATION INVARIANT:
          </span>
          <span className="font-mono" style={{ fontSize: '0.85rem' }}>
            available (<strong>{inventory.available}</strong>) + reserved (
            <strong>{inventory.reserved}</strong>) + sold (<strong>{inventory.sold}</strong>) = total (
            <strong>{inventory.total}</strong>)
          </span>
        </div>
        <div>
          {isInvariantValid ? (
            <span className="badge badge-emerald">✓ INVARIANT PRESERVED</span>
          ) : (
            <span className="badge badge-amber">⚠ INVARIANT VIOLATED</span>
          )}
        </div>
      </div>
    </div>
  );
};
