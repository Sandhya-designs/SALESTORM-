import React, { useState } from 'react';
import { useOrderStore } from '../hooks/useOrderStore';
import { OrderSummaryCards } from '../components/orders/OrderSummaryCards';
import { OrderTraceDemoBox } from '../components/orders/OrderTraceDemoBox';
import { OrderTable } from '../components/orders/OrderTable';
import { OrderDetailPanel } from '../components/orders/OrderDetailPanel';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, RefreshCw, Network } from 'lucide-react';
import type { OrderRecord } from '../types';

export const OrdersPage: React.FC = () => {
  const { orders, transitionOrder, createDemoTraceFlow, resetOrders } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Sync selectedOrder with updated state in orders list
  const activeSelectedOrder = selectedOrder
    ? orders.find((o) => o.id === selectedOrder.id) || selectedOrder
    : null;

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Order Lifecycle &amp; Fulfillment
            </h1>
            <StatusBadge label="FINITE STATE MACHINE" variant="cyan" pulse={true} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={14} className="text-cyan" />
            <span>Deterministic state transitions enforcing inventory-backed commitments with end-to-end trace correlation.</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetOrders}
            title="Reset orders ledger"
          >
            <RefreshCw size={14} />
            <span>RESET ORDERS</span>
          </button>
          <StatusBadge
            label="TRACEABILITY READY"
            variant="emerald"
            icon={<Network size={13} />}
          />
        </div>
      </div>

      {/* 1. Order Summary KPI Cards */}
      <OrderSummaryCards orders={orders} />

      {/* 2. End-to-End Trace Demo Box (Reservation -> Payment -> Order) */}
      <OrderTraceDemoBox
        onRunDemo={createDemoTraceFlow}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
      />

      {/* 3. Main Order Table */}
      <OrderTable
        orders={orders}
        selectedOrderId={activeSelectedOrder ? activeSelectedOrder.id : null}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
      />

      {/* 4. Order Detail & Timeline Modal (Opens on row click) */}
      {activeSelectedOrder && (
        <OrderDetailPanel
          order={activeSelectedOrder}
          onClose={() => setSelectedOrder(null)}
          onTransition={transitionOrder}
        />
      )}
    </div>
  );
};
