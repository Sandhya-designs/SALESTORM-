import type {
  OrderRecord,
  OrderStatus,
  PaymentRecord,
  Reservation,
} from '../types';
import { reservationService } from './reservationService';

type Listener = () => void;

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [], // Terminal
  CANCELLED: [], // Terminal
};

export const ORDER_LIFECYCLE_STEPS: OrderStatus[] = [
  'CREATED',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

class OrderService {
  private orders: Map<string, OrderRecord> = new Map();
  private listeners: Set<Listener> = new Set();
  private orderCounter: number = 101;

  constructor() {
    this.seedInitialOrders();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying order listener', err);
      }
    }
  }

  public getOrders(): OrderRecord[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  public getOrderById(id: string): OrderRecord | undefined {
    return this.orders.get(id);
  }

  /**
   * INTEGRATION RULE:
   * 1. Successful payment creates a confirmed order.
   * 2. Reservation must be confirmed before the order becomes confirmed.
   * 3. Failed payment must NOT create a confirmed order.
   */
  public createOrderFromPayment(
    payment: PaymentRecord,
    reservation: Reservation
  ): OrderRecord | null {
    // Rule: Failed payment must not create a confirmed order.
    if (payment.status !== 'SUCCESS') {
      console.warn('Cannot create confirmed order from non-successful payment', payment);
      return null;
    }

    // Rule: Reservation must be confirmed before order becomes confirmed.
    if (reservation.status !== 'CONFIRMED') {
      console.warn('Reservation must be confirmed before order can be created', reservation);
      return null;
    }

    // Check if order already exists for this payment
    for (const ord of this.orders.values()) {
      if (ord.paymentId === payment.id || ord.reservationId === reservation.id) {
        return ord;
      }
    }

    const now = Date.now();
    const orderId = `ORD-2026-${String(this.orderCounter++).padStart(4, '0')}`;

    const newOrder: OrderRecord = {
      id: orderId,
      reservationId: reservation.id,
      paymentId: payment.id,
      customerId: payment.customerId,
      productId: reservation.productId,
      productName: 'FlashGuard Limited Product',
      quantity: reservation.quantity,
      totalAmount: payment.amount,
      paymentStatus: payment.status,
      orderStatus: 'CONFIRMED',
      timeline: [
        {
          status: 'CREATED',
          timestamp: reservation.createdAt,
          note: `Order intent created from atomic reservation ${reservation.id}`,
        },
        {
          status: 'PAYMENT_PENDING',
          timestamp: payment.createdAt,
          note: `Payment authorization initiated (${payment.id}) for $${payment.amount.toFixed(2)}`,
        },
        {
          status: 'CONFIRMED',
          timestamp: now,
          note: `Payment capture confirmed. Inventory lock committed to permanent sales ledger.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
      shippingAddress: '42 SysCrafters Blvd, Suite 2026, San Francisco, CA',
    };

    this.orders.set(orderId, newOrder);
    this.notify();
    return newOrder;
  }

  /**
   * STATE MACHINE TRANSITION:
   * Prevents invalid state transitions.
   */
  public transitionOrder(
    orderId: string,
    nextStatus: OrderStatus,
    note?: string
  ): { success: boolean; message: string } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: `Order ${orderId} not found.` };
    }

    const currentStatus = order.orderStatus;
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      return {
        success: false,
        message: `Invalid state transition: Cannot transition order from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ') || 'None'}].`,
      };
    }

    const now = Date.now();
    order.orderStatus = nextStatus;
    order.updatedAt = now;

    const defaultNotes: Record<OrderStatus, string> = {
      CREATED: 'Order created',
      PAYMENT_PENDING: 'Awaiting payment authorization',
      CONFIRMED: 'Order confirmed with inventory reserved',
      PROCESSING: 'Order dispatched to fulfillment center warehouse packing line',
      SHIPPED: 'Package picked up by regional freight courier; tracking active',
      OUT_FOR_DELIVERY: 'Courier vehicle dispatched for final-mile doorstep delivery',
      DELIVERED: 'Package successfully delivered and signed for at customer doorstep',
      CANCELLED: 'Order cancelled by customer or operator',
    };

    order.timeline.push({
      status: nextStatus,
      timestamp: now,
      note: note || defaultNotes[nextStatus],
    });

    this.notify();
    return {
      success: true,
      message: `Order ${orderId} successfully transitioned to ${nextStatus}.`,
    };
  }

  /**
   * End-to-end Demo Flow:
   * Reservation -> Payment -> Order
   * Connects all 3 IDs together for tracing and observability.
   */
  public createDemoTraceFlow(): {
    reservation: Reservation;
    payment: PaymentRecord;
    order: OrderRecord;
  } | null {
    const custId = `usr_trace_${Math.floor(100 + Math.random() * 900)}`;
    const idemRes = `idem_trace_res_${Math.random().toString(36).substring(2, 7)}`;
    const idemPay = `idem_trace_pay_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Reserve Inventory
    const resResult = reservationService.reserveInventory({
      customerId: custId,
      quantity: 1,
      idempotencyKey: idemRes,
      ttlSeconds: 300,
    });

    if (!resResult.success) {
      console.warn('Could not acquire reservation for demo trace flow');
      return null;
    }

    const reservation = resResult.reservation;

    // 2. Mark Payment Pending & Confirm Reservation
    reservationService.markPaymentPending(reservation.id);
    reservationService.confirmReservation(reservation.id);

    // 3. Create Successful Payment
    const now = Date.now();
    const paymentId = `PAY-TRACE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const payment: PaymentRecord = {
      id: paymentId,
      reservationId: reservation.id,
      customerId: custId,
      amount: 49.99,
      status: 'SUCCESS',
      idempotencyKey: idemPay,
      createdAt: now,
      updatedAt: now,
      gatewayRef: `GW-TRACE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    // 4. Create Confirmed Order
    const order = this.createOrderFromPayment(payment, {
      ...reservation,
      status: 'CONFIRMED',
    });

    if (!order) return null;

    return {
      reservation,
      payment,
      order,
    };
  }

  public resetOrders(): void {
    this.orders.clear();
    this.notify();
  }

  private seedInitialOrders(): void {
    if (this.orders.size > 0) return;

    const now = Date.now();

    const ord1: OrderRecord = {
      id: 'ORD-2026-0001',
      reservationId: 'RES-DEMO-01',
      paymentId: 'PAY-0001',
      customerId: 'usr_alpha_101',
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      quantity: 1,
      totalAmount: 49.99,
      paymentStatus: 'SUCCESS',
      orderStatus: 'SHIPPED',
      timeline: [
        {
          status: 'CREATED',
          timestamp: now - 3600000,
          note: 'Reservation acquired (RES-DEMO-01)',
        },
        {
          status: 'PAYMENT_PENDING',
          timestamp: now - 3500000,
          note: 'Payment authorization started (PAY-0001)',
        },
        {
          status: 'CONFIRMED',
          timestamp: now - 3400000,
          note: 'Payment authorized; order confirmed and registered in sales ledger',
        },
        {
          status: 'PROCESSING',
          timestamp: now - 2400000,
          note: 'Package boxed and verified in automated fulfillment bay 4',
        },
        {
          status: 'SHIPPED',
          timestamp: now - 1200000,
          note: 'In transit via FedEx Express (Tracking: FX-992140-FG)',
        },
      ],
      createdAt: now - 3600000,
      updatedAt: now - 1200000,
      shippingAddress: '742 Evergreen Terrace, Springfield, OR',
    };

    const ord2: OrderRecord = {
      id: 'ORD-2026-0002',
      reservationId: 'RES-DEMO-02',
      paymentId: 'PAY-0002',
      customerId: 'usr_beta_204',
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      quantity: 2,
      totalAmount: 99.98,
      paymentStatus: 'SUCCESS',
      orderStatus: 'PROCESSING',
      timeline: [
        {
          status: 'CREATED',
          timestamp: now - 1800000,
          note: 'Reservation acquired (RES-DEMO-02)',
        },
        {
          status: 'PAYMENT_PENDING',
          timestamp: now - 1700000,
          note: 'Payment authorization started (PAY-0002)',
        },
        {
          status: 'CONFIRMED',
          timestamp: now - 1600000,
          note: 'Payment authorized; stock decrement committed',
        },
        {
          status: 'PROCESSING',
          timestamp: now - 600000,
          note: 'Warehouse team pick & pack in progress',
        },
      ],
      createdAt: now - 1800000,
      updatedAt: now - 600000,
      shippingAddress: '221B Baker Street, London, UK',
    };

    const ord3: OrderRecord = {
      id: 'ORD-2026-0003',
      reservationId: 'RES-DEMO-04',
      paymentId: 'PAY-0004',
      customerId: 'usr_gamma_309',
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      quantity: 1,
      totalAmount: 49.99,
      paymentStatus: 'SUCCESS',
      orderStatus: 'DELIVERED',
      timeline: [
        { status: 'CREATED', timestamp: now - 7200000, note: 'Reservation lock acquired' },
        { status: 'PAYMENT_PENDING', timestamp: now - 7100000, note: 'Payment processing' },
        { status: 'CONFIRMED', timestamp: now - 7000000, note: 'Payment captured' },
        { status: 'PROCESSING', timestamp: now - 5000000, note: 'Fulfillment completed' },
        { status: 'SHIPPED', timestamp: now - 3000000, note: 'Dispatched to courier' },
        { status: 'OUT_FOR_DELIVERY', timestamp: now - 1000000, note: 'On courier delivery van' },
        { status: 'DELIVERED', timestamp: now - 300000, note: 'Delivered at front door' },
      ],
      createdAt: now - 7200000,
      updatedAt: now - 300000,
      shippingAddress: '10 Downing Street, London, UK',
    };

    const ord4: OrderRecord = {
      id: 'ORD-2026-0004',
      reservationId: 'RES-DEMO-05',
      paymentId: 'PAY-0005',
      customerId: 'usr_delta_401',
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      quantity: 1,
      totalAmount: 49.99,
      paymentStatus: 'SUCCESS',
      orderStatus: 'CONFIRMED',
      timeline: [
        { status: 'CREATED', timestamp: now - 900000, note: 'Reservation lock acquired (RES-DEMO-05)' },
        { status: 'PAYMENT_PENDING', timestamp: now - 800000, note: 'Payment authorization initiated (PAY-0005)' },
        { status: 'CONFIRMED', timestamp: now - 750000, note: 'Payment captured; order confirmed. Ready for warehouse processing.' },
      ],
      createdAt: now - 900000,
      updatedAt: now - 750000,
      shippingAddress: '1600 Amphitheatre Parkway, Mountain View, CA',
    };

    const ord5: OrderRecord = {
      id: 'ORD-2026-0005',
      reservationId: 'RES-DEMO-06',
      paymentId: 'PAY-0006',
      customerId: 'usr_epsilon_502',
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      quantity: 1,
      totalAmount: 49.99,
      paymentStatus: 'SUCCESS',
      orderStatus: 'OUT_FOR_DELIVERY',
      timeline: [
        { status: 'CREATED', timestamp: now - 14400000, note: 'Reservation lock acquired' },
        { status: 'PAYMENT_PENDING', timestamp: now - 14300000, note: 'Payment processed' },
        { status: 'CONFIRMED', timestamp: now - 14200000, note: 'Order confirmed' },
        { status: 'PROCESSING', timestamp: now - 10000000, note: 'Packed at distribution hub' },
        { status: 'SHIPPED', timestamp: now - 5000000, note: 'Departed regional logistics center' },
        { status: 'OUT_FOR_DELIVERY', timestamp: now - 600000, note: 'Courier out for final delivery (Estimated by 2:00 PM)' },
      ],
      createdAt: now - 14400000,
      updatedAt: now - 600000,
      shippingAddress: '350 5th Avenue, New York, NY',
    };

    const ord6: OrderRecord = {
      id: 'ORD-2026-0006',
      reservationId: 'RES-DEMO-07',
      paymentId: 'PAY-0007',
      customerId: 'usr_zeta_603',
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      quantity: 1,
      totalAmount: 49.99,
      paymentStatus: 'SUCCESS',
      orderStatus: 'CANCELLED',
      timeline: [
        { status: 'CREATED', timestamp: now - 18000000, note: 'Reservation lock acquired' },
        { status: 'PAYMENT_PENDING', timestamp: now - 17900000, note: 'Payment authorization started' },
        { status: 'CONFIRMED', timestamp: now - 17800000, note: 'Order confirmed' },
        { status: 'CANCELLED', timestamp: now - 15000000, note: 'Customer requested order cancellation before warehouse packing' },
      ],
      createdAt: now - 18000000,
      updatedAt: now - 15000000,
      shippingAddress: '1 Infinite Loop, Cupertino, CA',
    };

    this.orders.set(ord1.id, ord1);
    this.orders.set(ord2.id, ord2);
    this.orders.set(ord3.id, ord3);
    this.orders.set(ord4.id, ord4);
    this.orders.set(ord5.id, ord5);
    this.orders.set(ord6.id, ord6);
  }
}

export const orderService = new OrderService();
