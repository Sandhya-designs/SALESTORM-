import React from 'react';
import { useInventoryStore } from '../../src/hooks/useInventoryStore';
import { InventorySummaryCards } from '../components/inventory/InventorySummaryCards';
import { ReserveTesterPanel } from '../components/inventory/ReserveTesterPanel';
import { InventoryTransactionTable } from '../components/inventory/InventoryTransactionTable';
import { StatusBadge } from '../components/StatusBadge';
import { Boxes, ShieldAlert, RotateCcw } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const {
    inventory,
    reservations,
    isInvariantValid,
    reserveInventory,
    releaseReservation,
    confirmReservation,
    expireReservation,
    resetStore,
  } = useInventoryStore();

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Inventory Domain Ledger
            </h1>
            <StatusBadge label="ATOMIC MEMORY GUARD" variant="emerald" pulse={true} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Boxes size={14} className="text-cyan" />
            <span>Product: <strong>{inventory.productName}</strong> • Invariant: <code>available + reserved + sold = {inventory.total}</code></span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetStore}
            title="Reset inventory store back to 100 available units"
          >
            <RotateCcw size={14} />
            <span>RESET INVENTORY</span>
          </button>
          <StatusBadge
            label={isInvariantValid ? 'CONSERVATION VALID' : 'INVARIANT BREACH'}
            variant={isInvariantValid ? 'emerald' : 'amber'}
            icon={<ShieldAlert size={13} />}
          />
        </div>
      </div>

      {/* 1. Inventory Summary Cards & Invariant Equation */}
      <InventorySummaryCards
        inventory={inventory}
        isInvariantValid={isInvariantValid}
      />

      {/* 2. Interactive Atomic Reserve & Idempotency Tester Panel */}
      <ReserveTesterPanel
        onReserve={reserveInventory}
        availableStock={inventory.available}
      />

      {/* 3. Inventory Transaction Table */}
      <InventoryTransactionTable
        reservations={reservations}
        onRelease={releaseReservation}
        onConfirm={confirmReservation}
        onExpire={expireReservation}
      />
    </div>
  );
};
