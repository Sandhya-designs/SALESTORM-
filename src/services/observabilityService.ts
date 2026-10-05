import { reservationService } from './reservationService';
import { paymentService } from './paymentService';
import { orderService } from './orderService';
import { failureSimulationService } from './failureSimulationService';
import type {
  ObservabilityMetrics,
  ServiceHealthItem,
  SystemAlert,
  TraceSpan,
} from '../types';

type Listener = () => void;

class ObservabilityService {
  private listeners: Set<Listener> = new Set();
  private initialTime = Date.now();

  constructor() {
    reservationService.subscribe(() => this.notify());
    paymentService.subscribe(() => this.notify());
    orderService.subscribe(() => this.notify());
    failureSimulationService.subscribe(() => this.notify());
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
        console.error('Error notifying observability listener', err);
      }
    }
  }

  public getMetrics(): ObservabilityMetrics {
    const inv = reservationService.getInventory();
    const reservations = reservationService.getReservations();
    const payStats = paymentService.getStats();
    const orders = orderService.getOrders();

    const totalReservations = reservations.length;
    const successfulReservations = reservations.filter(
      (r) => r.status === 'RESERVED' || r.status === 'PAYMENT_PENDING' || r.status === 'CONFIRMED'
    ).length;
    const failedReservations = reservations.filter((r) => r.status === 'FAILED').length;
    const expiredReservations = reservations.filter((r) => r.status === 'EXPIRED').length;

    const reservationExpiryRate = totalReservations > 0
      ? Math.round((expiredReservations / totalReservations) * 100)
      : 0;

    const paymentSuccessRate = payStats.total > 0
      ? Math.round((payStats.successful / payStats.total) * 100)
      : 100;

    const paymentFailureRate = payStats.total > 0
      ? Math.round((payStats.failed / payStats.total) * 100)
      : 0;

    const confirmedOrders = orders.filter((o) => o.orderStatus !== 'CANCELLED').length;
    const orderConversionRate = totalReservations > 0
      ? Math.min(100, Math.round((confirmedOrders / Math.max(1, successfulReservations)) * 100))
      : 0;

    // Invariant calculation: total must always be 100
    const oversold = Math.max(0, inv.sold + inv.reserved - inv.total);

    return {
      requestsPerSec: totalReservations > 200 ? 1250 : totalReservations > 0 ? 85 : 0,
      successfulReservations,
      failedReservations,
      currentAvailableInventory: inv.available,
      currentReservedInventory: inv.reserved,
      currentSoldInventory: inv.sold,
      reservationExpiryRate,
      paymentSuccessRate,
      paymentFailureRate,
      orderConversionRate,
      avgProcessingTimeMs: 14.2,
      p95LatencyMs: 28.5,
      queueBacklog: 0,
      systemErrors: payStats.failed + payStats.timeouts,
      oversold,
    };
  }

  public getServiceHealth(): ServiceHealthItem[] {
    const scenarios = failureSimulationService.getScenarios();
    const orderScenario = scenarios.find((s) => s.id === 'ORDER_SERVICE_DOWN');
    const redisScenario = scenarios.find((s) => s.id === 'REDIS_UNAVAILABLE');
    const invScenario = scenarios.find((s) => s.id === 'INVENTORY_SERVICE_FAILURE');
    const payTimeoutScenario = scenarios.find((s) => s.id === 'PAYMENT_GATEWAY_TIMEOUT');

    return [
      {
        id: 'inventory',
        name: 'Inventory Service',
        status: invScenario?.status === 'SIMULATING' ? 'DEGRADED' : 'HEALTHY',
        latencyMs: invScenario?.status === 'SIMULATING' ? 142 : 3.8,
        uptime: '99.99%',
        details: 'Atomic CAS Invariant Guard Active • 0 oversold',
      },
      {
        id: 'payment',
        name: 'Payment Service',
        status: payTimeoutScenario?.status === 'SIMULATING' ? 'DEGRADED' : 'HEALTHY',
        latencyMs: payTimeoutScenario?.status === 'SIMULATING' ? 3120 : 42.1,
        uptime: '99.95%',
        details: 'Local Simulated Gateway • 95% nominal capture rate',
      },
      {
        id: 'order',
        name: 'Order Service',
        status: orderScenario?.status === 'SIMULATING' ? 'DOWN' : 'HEALTHY',
        latencyMs: orderScenario?.status === 'SIMULATING' ? 0 : 8.4,
        uptime: orderScenario?.status === 'SIMULATING' ? '92.40%' : '99.98%',
        details: orderScenario?.status === 'SIMULATING'
          ? 'Offline (HTTP 503) • Transactional outbox buffer queueing events'
          : 'Deterministic Finite State Machine • Online',
      },
      {
        id: 'broker',
        name: 'Message Broker (Kafka)',
        status: 'HEALTHY',
        latencyMs: 1.9,
        uptime: '100.0%',
        details: 'Partitioned event log • Outbox consumer active',
      },
      {
        id: 'redis',
        name: 'Redis Distributed Cache',
        status: redisScenario?.status === 'SIMULATING' ? 'DOWN' : 'HEALTHY',
        latencyMs: redisScenario?.status === 'SIMULATING' ? 0 : 0.8,
        uptime: redisScenario?.status === 'SIMULATING' ? '94.10%' : '99.99%',
        details: redisScenario?.status === 'SIMULATING'
          ? 'Circuit breaker OPEN • Local mutex fallback active'
          : 'Sub-millisecond sliding window & lock leases',
      },
      {
        id: 'database',
        name: 'SQL Database Ledger',
        status: invScenario?.status === 'SIMULATING' ? 'DEGRADED' : 'HEALTHY',
        latencyMs: invScenario?.status === 'SIMULATING' ? 280 : 5.4,
        uptime: '99.99%',
        details: 'ACID Serializable Sales Ledger • Synchronous multi-AZ',
      },
    ];
  }

  public getSystemAlerts(): SystemAlert[] {
    const inv = reservationService.getInventory();
    const reservations = reservationService.getReservations();
    const payments = paymentService.getPayments();
    const scenarios = failureSimulationService.getScenarios();
    const orderScenario = scenarios.find((s) => s.id === 'ORDER_SERVICE_DOWN');

    const alerts: SystemAlert[] = [];
    const now = Date.now();

    // 1. Inventory exhausted
    if (inv.available === 0) {
      alerts.push({
        id: 'alert-inv-exhausted',
        level: 'WARNING',
        title: 'Inventory Exhausted',
        message: 'All 100 available units are allocated to reservations or confirmed orders. New reservations will be safely rejected.',
        timestamp: now - 15000,
        active: true,
      });
    }

    // 2. Payment timeout rate increased
    const timeoutPayments = payments.filter(
      (p) => p.status === 'TIMEOUT' || p.status === 'RECONCILIATION_REQUIRED'
    ).length;
    if (timeoutPayments > 0) {
      alerts.push({
        id: 'alert-pay-timeout',
        level: 'WARNING',
        title: 'Payment Timeout Rate Increased',
        message: `${timeoutPayments} payment authorization(s) experienced gateway timeout (504). Lock held in reconciliation queue to prevent leakage.`,
        timestamp: now - 35000,
        active: true,
      });
    }

    // 3. Order processing delayed
    if (orderScenario?.status === 'SIMULATING') {
      alerts.push({
        id: 'alert-order-delay',
        level: 'CRITICAL',
        title: 'Order Processing Delayed',
        message: 'Order Service instance unreachable (HTTP 503). Transactional Outbox active: events buffered in durable queue pending retry.',
        timestamp: now - 5000,
        active: true,
      });
    }

    // 4. Reservation expiry rate high
    const expiredCount = reservations.filter((r) => r.status === 'EXPIRED').length;
    if (expiredCount > 0) {
      alerts.push({
        id: 'alert-expiry-high',
        level: 'INFO',
        title: 'Reservation Expiry Rate Active',
        message: `${expiredCount} abandoned reservation(s) expired. Background reaper sweeper automatically restored units to available inventory pool.`,
        timestamp: now - 60000,
        active: true,
      });
    }

    // 5. Duplicate request detected
    const dupScenario = scenarios.find((s) => s.id === 'DUPLICATE_PURCHASE_REQUEST');
    if (dupScenario?.status === 'RECOVERED' || dupScenario?.status === 'SIMULATING') {
      alerts.push({
        id: 'alert-duplicate-req',
        level: 'INFO',
        title: 'Duplicate Request Detected',
        message: 'Idempotency filter intercepted duplicate purchase submission. Reused original reservation/order without double-allocation.',
        timestamp: now - 45000,
        active: true,
      });
    }

    return alerts;
  }

  public getTraceSpans(): TraceSpan[] {
    const orders = orderService.getOrders();
    const baseTime = this.initialTime;

    return orders.map((ord, idx) => {
      const offset = (orders.length - idx) * 45000;
      const reqTime = ord.createdAt - 28;
      const resTime = ord.createdAt - 22;
      const payTime = ord.createdAt - 8;
      const ordTime = ord.createdAt;

      return {
        requestId: `REQ-${String(10200 + idx).padStart(5, '0')}`,
        reservationId: ord.reservationId || `RES-${String(101 + idx).padStart(4, '0')}`,
        paymentId: ord.paymentId || `PAY-${String(101 + idx).padStart(4, '0')}`,
        orderId: ord.id,
        customerId: ord.customerId,
        requestTime: reqTime || baseTime - offset,
        reservationTime: resTime || baseTime - offset + 6,
        paymentTime: payTime || baseTime - offset + 18,
        orderTime: ordTime || baseTime - offset + 28,
        totalDurationMs: 28,
        status: ord.orderStatus === 'CANCELLED' ? 'REVERTED' : 'CONFIRMED',
      };
    });
  }

  public getChartData() {
    const inv = reservationService.getInventory();
    const reservations = reservationService.getReservations();
    const payments = paymentService.getPayments();
    const orders = orderService.getOrders();

    // 1. Request Traffic over time (last 6 periods)
    const trafficPoints = [
      { time: 'T-5m', requests: 120, capacity: 5000 },
      { time: 'T-4m', requests: 480, capacity: 5000 },
      { time: 'T-3m', requests: 1850, capacity: 5000 },
      { time: 'T-2m', requests: 7400, capacity: 5000 },
      { time: 'T-1m', requests: 9850, capacity: 5000 },
      { time: 'NOW', requests: reservations.length > 500 ? 10000 : reservations.length * 15, capacity: 5000 },
    ];

    // 2. Reservation Success / Failure
    const successfulRes = reservations.filter(
      (r) => r.status === 'RESERVED' || r.status === 'PAYMENT_PENDING' || r.status === 'CONFIRMED'
    ).length;
    const failedRes = reservations.filter((r) => r.status === 'FAILED').length;
    const expiredRes = reservations.filter((r) => r.status === 'EXPIRED').length;

    const reservationOutcomes = [
      { name: 'Successful', count: successfulRes || (inv.reserved + inv.sold), color: 'var(--accent-emerald)' },
      { name: 'Rejected / Out of Stock', count: failedRes || Math.max(0, reservations.length - 100), color: '#f43f5e' },
      { name: 'Expired Holds', count: expiredRes, color: 'var(--accent-amber)' },
    ];

    // 3. Payment Outcomes
    const successPay = payments.filter((p) => p.status === 'SUCCESS').length;
    const failedPay = payments.filter((p) => p.status === 'FAILED').length;
    const timeoutPay = payments.filter(
      (p) => p.status === 'TIMEOUT' || p.status === 'RECONCILIATION_REQUIRED'
    ).length;

    const paymentOutcomes = [
      { name: 'Success (200)', count: successPay, color: 'var(--accent-emerald)' },
      { name: 'Declined (402)', count: failedPay, color: '#f43f5e' },
      { name: 'Timeout / Reconcile (504)', count: timeoutPay, color: 'var(--accent-amber)' },
    ];

    // 4. Order Conversion Funnel
    const totalRequests = reservations.length > 0 ? reservations.length : 100;
    const totalReserved = successfulRes || (inv.reserved + inv.sold);
    const totalPaid = successPay || inv.sold;
    const totalOrdered = orders.filter((o) => o.orderStatus !== 'CANCELLED').length || inv.sold;

    const orderConversionFunnel = [
      { stage: '1. Purchase Requests', count: totalRequests, rate: 100 },
      { stage: '2. Atomic Reservations', count: totalReserved, rate: Math.round((totalReserved / Math.max(1, totalRequests)) * 100) },
      { stage: '3. Payment Authorized', count: totalPaid, rate: Math.round((totalPaid / Math.max(1, totalReserved || 1)) * 100) },
      { stage: '4. Orders Committed', count: totalOrdered, rate: Math.round((totalOrdered / Math.max(1, totalPaid || 1)) * 100) },
    ];

    // 5. Inventory Balance Over Time
    const inventoryHistory = [
      { time: 'Initial', available: 100, reserved: 0, sold: 0 },
      { time: 'T-3m', available: Math.max(0, 100 - Math.floor(inv.reserved * 0.3)), reserved: Math.floor(inv.reserved * 0.3), sold: 0 },
      { time: 'T-2m', available: Math.max(0, 100 - Math.floor(inv.reserved * 0.7)), reserved: Math.floor(inv.reserved * 0.7), sold: Math.floor(inv.sold * 0.5) },
      { time: 'T-1m', available: Math.max(0, inv.available + 10), reserved: Math.max(0, inv.reserved - 5), sold: Math.max(0, inv.sold - 5) },
      { time: 'Current', available: inv.available, reserved: inv.reserved, sold: inv.sold },
    ];

    return {
      trafficPoints,
      reservationOutcomes,
      paymentOutcomes,
      orderConversionFunnel,
      inventoryHistory,
    };
  }
}

export const observabilityService = new ObservabilityService();
