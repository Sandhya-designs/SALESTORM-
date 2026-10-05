import React from 'react';
import type { OrderRecord, OrderStatus } from '../../types';
import { ShoppingBag, Eye } from 'lucide-react';

interface OrderTableProps {
  orders: OrderRecord[];
  selectedOrderId: string | null;
  onSelectOrder: (order: OrderRecord) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  selectedOrderId,
  onSelectOrder,
}) => {
  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="sample-badge badge-emerald">DELIVERED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="sample-badge badge-cyan">OUT FOR DELIVERY</span>;
      case 'SHIPPED':
        return <span className="sample-badge badge-cyan">SHIPPED</span>;
      case 'PROCESSING':
        return <span className="sample-badge badge-purple">PROCESSING</span>;
      case 'CONFIRMED':
        return <span className="sample-badge badge-emerald">CONFIRMED</span>;
      case 'PAYMENT_PENDING':
        return <span className="sample-badge badge-amber">PAYMENT PENDING</span>;
      case 'CANCELLED':
        return <span className="sample-badge badge-danger">CANCELLED</span>;
      case 'CREATED':
      default:
        return <span className="sample-badge badge-dark">CREATED</span>;
    }
  };

  return (
    <div className="traffic-table-card">
      <div className="traffic-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={16} className="text-cyan" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
            ORDER FULFILLMENT &amp; COMMITMENT LEDGER
          </span>
        </div>
        <div className="traffic-table-sub font-mono">
          {orders.length} orders committed • Click row to inspect timeline
        </div>
      </div>

      <div className="table-responsive">
        <table className="flash-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>PRODUCT</th>
              <th>QUANTITY</th>
              <th>PAYMENT STATUS</th>
              <th>ORDER STATUS</th>
              <th>CREATED</th>
              <th>UPDATED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No orders committed yet. Complete a payment simulation or execute a demo trace flow above.
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                return (
                  <tr
                    key={ord.id}
                    onClick={() => onSelectOrder(ord)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : undefined,
                    }}
                  >
                    <td className="font-mono text-cyan font-bold">{ord.id}</td>
                    <td className="font-mono">{ord.customerId}</td>
                    <td style={{ color: 'var(--text-main)' }}>{ord.productName}</td>
                    <td className="font-mono font-bold" style={{ color: '#ffffff' }}>
                      {ord.quantity}
                    </td>
                    <td>
                      <span className="sample-badge badge-emerald">{ord.paymentStatus}</span>
                    </td>
                    <td>{getOrderStatusBadge(ord.orderStatus)}</td>
                    <td className="font-mono text-muted">{new Date(ord.createdAt).toLocaleTimeString()}</td>
                    <td className="font-mono text-muted">{new Date(ord.updatedAt).toLocaleTimeString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-action btn-action-release"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(ord);
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
