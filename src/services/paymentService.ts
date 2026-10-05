import type {
  PaymentRecord,
  PaymentSimulationConfig,
  SimulatePaymentRequest,
  SimulatePaymentResult,
} from '../types';
import { reservationService } from './reservationService';
import { orderService } from './orderService';

type Listener = () => void;

class PaymentService {
  private payments: Map<string, PaymentRecord> = new Map();
  // Map of customerId:idempotencyKey -> paymentId
  private idempotencyIndex: Map<string, string> = new Map();
  private config: PaymentSimulationConfig = {
    successRate: 95,
    failureRate: 5,
    timeoutRate: 0,
  };
  private listeners: Set<Listener> = new Set();
  private paymentCounter: number = 1;

  constructor() {
    this.seedInitialPayments();
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
        console.error('Error notifying payment listener', err);
      }
    }
  }

  public getPayments(): PaymentRecord[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  public getConfig(): PaymentSimulationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PaymentSimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.notify();
  }

  public getStats() {
    const all = Array.from(this.payments.values());
    const total = all.length;
    const successful = all.filter((p) => p.status === 'SUCCESS').length;
    const failed = all.filter((p) => p.status === 'FAILED').length;
    const timeouts = all.filter(
      (p) => p.status === 'TIMEOUT' || p.status === 'RECONCILIATION_REQUIRED'
    ).length;
    const pending = all.filter(
      (p) => p.status === 'INITIATED' || p.status === 'PROCESSING'
    ).length;

    return {
      total,
      successful,
      failed,
      timeouts,
      pending,
    };
  }

  /**
   * SIMULATE PAYMENT OPERATION
   * 1. Idempotency Check: Same customer + idempotencyKey returns original payment without re-charging.
   * 2. Reservation state check and transition:
   *    RESERVED -> PAYMENT_PENDING -> (CONFIRMED on success | RELEASED on fail | RECONCILIATION_REQUIRED on timeout)
   */
  public async simulatePayment(
    req: SimulatePaymentRequest
  ): Promise<SimulatePaymentResult> {
    const { customerId, reservationId, amount, idempotencyKey, forcedOutcome } = req;
    const idempotencyId = `${customerId.trim().toLowerCase()}:${idempotencyKey.trim()}`;

    // 1. Idempotency Verification
    const existingPaymentId = this.idempotencyIndex.get(idempotencyId);
    if (existingPaymentId) {
      const existing = this.payments.get(existingPaymentId);
      if (existing) {
        return {
          payment: { ...existing },
          isIdempotentReplay: true,
          reservationStatusBefore: 'UNCHANGED',
          reservationStatusAfter: existing.status,
          message: `Idempotent duplicate detected: Replayed existing payment ${existing.id} (${existing.status}). No duplicate charge processed.`,
        };
      }
    }

    const now = Date.now();
    const paymentId = `PAY-${String(this.paymentCounter++).padStart(4, '0')}`;

    // Find reservation
    const reservations = reservationService.getReservations();
    const targetRes = reservations.find((r) => r.id === reservationId);
    const resStatusBefore = targetRes ? targetRes.status : 'UNKNOWN';

    // Step A: Mark reservation as PAYMENT_PENDING
    if (targetRes && targetRes.status === 'RESERVED') {
      reservationService.markPaymentPending(reservationId);
    }

    // Step B: Determine payment outcome
    let outcome: 'SUCCESS' | 'FAILED' | 'TIMEOUT';

    if (forcedOutcome && forcedOutcome !== 'AUTO') {
      outcome = forcedOutcome === 'FAILURE' ? 'FAILED' : forcedOutcome;
    } else {
      const rand = Math.random() * 100;
      if (rand < this.config.successRate) {
        outcome = 'SUCCESS';
      } else if (rand < this.config.successRate + this.config.failureRate) {
        outcome = 'FAILED';
      } else {
        outcome = 'TIMEOUT';
      }
    }

    let paymentStatus: PaymentRecord['status'];
    let failureReason: string | undefined;

    if (outcome === 'SUCCESS') {
      paymentStatus = 'SUCCESS';
      // RESERVED / PAYMENT_PENDING -> CONFIRMED
      reservationService.confirmReservation(reservationId);
    } else if (outcome === 'FAILED') {
      paymentStatus = 'FAILED';
      failureReason = 'Simulated card decline / insufficient buyer balance';
      // RESERVED / PAYMENT_PENDING -> RELEASED
      reservationService.releaseReservation(reservationId);
    } else {
      paymentStatus = 'RECONCILIATION_REQUIRED';
      failureReason = 'Simulated HTTP 504 Gateway Timeout: Awaiting external gateway webhook reconciliation';
      // TIMEOUT: RESERVED -> PAYMENT_PENDING -> RECONCILIATION_REQUIRED
      // Crucial: Do NOT automatically mark as failed! Keep reservation lock until reconciled.
    }

    const newPayment: PaymentRecord = {
      id: paymentId,
      reservationId,
      customerId,
      amount,
      status: paymentStatus,
      idempotencyKey,
      createdAt: now,
      updatedAt: Date.now(),
      gatewayRef: `GW-REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      failureReason,
    };

    this.payments.set(paymentId, newPayment);
    this.idempotencyIndex.set(idempotencyId, paymentId);

    const updatedRes = reservationService.getReservations().find((r) => r.id === reservationId);
    const resStatusAfter = updatedRes ? updatedRes.status : 'UNKNOWN';

    // Integration Rule: Successful payment creates a confirmed order
    if (outcome === 'SUCCESS' && updatedRes && updatedRes.status === 'CONFIRMED') {
      orderService.createOrderFromPayment(newPayment, updatedRes);
    }

    this.notify();

    return {
      payment: { ...newPayment },
      isIdempotentReplay: false,
      reservationStatusBefore: resStatusBefore,
      reservationStatusAfter: resStatusAfter,
      message:
        outcome === 'SUCCESS'
          ? `Payment ${paymentId} succeeded ($${amount.toFixed(2)}). Reservation & Order confirmed.`
          : outcome === 'FAILED'
          ? `Payment ${paymentId} failed. Reservation lock released back to available inventory.`
          : `Payment ${paymentId} timed out. Reservation held in reconciliation queue to prevent inventory leakage.`,
    };
  }

  /**
   * Reconcile a pending or timed-out payment
   */
  public reconcilePayment(
    paymentId: string,
    resolution: 'SUCCESS' | 'FAILED'
  ): boolean {
    const payment = this.payments.get(paymentId);
    if (!payment) return false;

    if (
      payment.status !== 'RECONCILIATION_REQUIRED' &&
      payment.status !== 'TIMEOUT' &&
      payment.status !== 'PROCESSING'
    ) {
      return false;
    }

    payment.updatedAt = Date.now();

    if (resolution === 'SUCCESS') {
      payment.status = 'SUCCESS';
      payment.failureReason = undefined;
      reservationService.confirmReservation(payment.reservationId);
      const updatedRes = reservationService.getReservations().find((r) => r.id === payment.reservationId);
      if (updatedRes) {
        orderService.createOrderFromPayment(payment, updatedRes);
      }
    } else {
      payment.status = 'FAILED';
      payment.failureReason = 'Reconciliation resolved: Payment capture unconfirmed. Reservation safely released.';
      reservationService.releaseReservation(payment.reservationId);
    }

    this.notify();
    return true;
  }

  public resetPayments(): void {
    this.payments.clear();
    this.idempotencyIndex.clear();
    this.notify();
  }

  private seedInitialPayments(): void {
    if (this.payments.size > 0) return;

    const now = Date.now();
    const p1: PaymentRecord = {
      id: 'PAY-0001',
      reservationId: 'RES-DEMO-01',
      customerId: 'usr_alpha_101',
      amount: 49.99,
      status: 'SUCCESS',
      idempotencyKey: 'idem_pay_alpha',
      createdAt: now - 360000,
      updatedAt: now - 359000,
      gatewayRef: 'GW-REF-99214A',
    };

    const p2: PaymentRecord = {
      id: 'PAY-0002',
      reservationId: 'RES-DEMO-02',
      customerId: 'usr_beta_204',
      amount: 99.98,
      status: 'FAILED',
      idempotencyKey: 'idem_pay_beta',
      createdAt: now - 240000,
      updatedAt: now - 239000,
      gatewayRef: 'GW-REF-44120B',
      failureReason: 'Simulated card decline (HTTP 402)',
    };

    const p3: PaymentRecord = {
      id: 'PAY-0003',
      reservationId: 'RES-DEMO-03',
      customerId: 'usr_gamma_309',
      amount: 49.99,
      status: 'RECONCILIATION_REQUIRED',
      idempotencyKey: 'idem_pay_gamma',
      createdAt: now - 120000,
      updatedAt: now - 118000,
      gatewayRef: 'GW-REF-88719C',
      failureReason: 'HTTP 504 Gateway Timeout - Lock preserved pending reconciliation query',
    };

    this.payments.set(p1.id, p1);
    this.idempotencyIndex.set(`usr_alpha_101:idem_pay_alpha`, p1.id);

    this.payments.set(p2.id, p2);
    this.idempotencyIndex.set(`usr_beta_204:idem_pay_beta`, p2.id);

    this.payments.set(p3.id, p3);
    this.idempotencyIndex.set(`usr_gamma_309:idem_pay_gamma`, p3.id);
  }
}

export const paymentService = new PaymentService();
