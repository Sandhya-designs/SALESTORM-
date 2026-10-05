import type {
  FailureScenario,
  FailureScenarioId,
  FailureLogEntry,
  OutboxRetryStep,
} from '../types';

type Listener = () => void;

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export const INITIAL_FAILURE_SCENARIOS: FailureScenario[] = [
  {
    id: 'PAYMENT_GATEWAY_TIMEOUT',
    name: 'Payment Gateway Timeout',
    category: 'PAYMENT',
    description: 'Simulated 504 Gateway Timeout during charge capture. Reservation lock must not be discarded.',
    expectedRecovery: 'Payment → TIMEOUT → Reconciliation → Status Check → Success/Failure',
    recoveryFlow: ['Payment Initiated', 'Gateway Timeout (504)', 'Status Reconciliation', 'Status Query Confirmed', 'Order Confirmed'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'PAYMENT_GATEWAY_FAILURE',
    name: 'Payment Gateway Failure',
    category: 'PAYMENT',
    description: 'Simulated payment processor rejection (Card Declined / 402). Locked inventory must be safely released.',
    expectedRecovery: 'Payment → FAILED → Auto-Release Reservation → Inventory Available +1 → Invariant Preserved',
    recoveryFlow: ['Charge Authorization', 'Gateway Decline (402)', 'Payment Marked Failed', 'Compensating Release', 'Inventory Reclaimed'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'ORDER_SERVICE_DOWN',
    name: 'Order Service Down',
    category: 'ORDER',
    description: 'Payment succeeds but Order Service is offline. Payment must NOT disappear; transactional outbox retries downstream.',
    expectedRecovery: 'Payment SUCCESS → Order Service Unavailable → Event Pending → Retry → Order Created',
    recoveryFlow: ['PAYMENT SUCCESS', 'ORDER SERVICE UNAVAILABLE', 'EVENT PENDING', 'RETRY', 'ORDER CREATED'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'DUPLICATE_PURCHASE_REQUEST',
    name: 'Duplicate Purchase Request',
    category: 'CONCURRENCY',
    description: 'Simultaneous duplicate purchase requests from same customer. System must ensure exactly 1 reservation, 1 payment, 1 order.',
    expectedRecovery: 'Request A + Request A Duplicate → Idempotency Cache Hit → 1 Reservation, 1 Payment, 1 Order',
    recoveryFlow: ['Request A Arrives', 'Reservation Locked', 'Request A Duplicate Arrives', 'Idempotency Cache Hit', 'Single Order Committed'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'DUPLICATE_PAYMENT_REQUEST',
    name: 'Duplicate Payment Request',
    category: 'PAYMENT',
    description: 'Customer double-clicks "Pay Now" or network retries charge. Idempotency key prevents double charging.',
    expectedRecovery: 'Payment 1 SUCCESS → Duplicate Payment 2 Intercepted → Return Cached Record (Zero Double Charge)',
    recoveryFlow: ['Payment Attempt 1', 'Card Charged Once', 'Payment Attempt 2', 'Idempotency Key Match', 'Replay Cached Response'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'RESERVATION_EXPIRY',
    name: 'Reservation Expiry',
    category: 'INVENTORY',
    description: 'User abandons checkout after reserving item. Background TTL reaper worker reclaims stock after expiry.',
    expectedRecovery: 'RESERVED → TTL Expiration (300s) → Sweeper Worker → Auto-Released to Available Stock',
    recoveryFlow: ['Stock Reserved', 'TTL Countdown', 'TTL Reached', 'Reaper Scans Store', 'Stock Restored to Available'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'MESSAGE_DUPLICATION',
    name: 'Message/Event Duplication',
    category: 'EVENT',
    description: 'Message broker redelivers the same fulfillment event twice. Consumer must process it idempotently.',
    expectedRecovery: 'Event 1 Processed → Event 1 Deduplication Key Stored → Event 2 Received → Dropped Idempotently',
    recoveryFlow: ['Event Published', 'Consumer Processes Event', 'Event ID Stored', 'Duplicate Event Redelivered', 'Deduplicated & Acknowledged'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'REDIS_UNAVAILABLE',
    name: 'Redis Unavailable',
    category: 'INFRASTRUCTURE',
    description: 'Distributed cache and lock manager connection crashes. Circuit breaker switches to in-memory safety lock.',
    expectedRecovery: 'Redis Ping Fail → Circuit Breaker Open → Fallback In-Memory Lock → System Operational',
    recoveryFlow: ['Redis Heartbeat Lost', 'Circuit Breaker OPEN', 'Fallback Lock Activated', 'Atomic Memory Mutex', 'Safe Concurrency Maintained'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
  {
    id: 'INVENTORY_SERVICE_FAILURE',
    name: 'Inventory Service Failure',
    category: 'INVENTORY',
    description: 'Database deadlock or write failure during reservation. Two-phase commit saga rolls back cleanly.',
    expectedRecovery: 'DB Write Timeout → Distributed Saga Rollback → Compensation Triggered → State Consistent',
    recoveryFlow: ['Atomic Tx Started', 'Simulated DB Deadlock', 'Rollback Signal', 'Compensation Executed', 'State Conserved'],
    status: 'IDLE',
    actualResult: null,
    lastRunTimestamp: null,
  },
];

class FailureSimulationService {
  private scenarios: Map<FailureScenarioId, FailureScenario> = new Map();
  private logs: FailureLogEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private logCounter = 1;

  // Dedicated Outbox state for Scenario 3
  private outboxSteps: OutboxRetryStep[] = [
    {
      step: 'PAYMENT_SUCCESS',
      label: 'Payment Success',
      timeStr: '--:--:--',
      status: 'pending',
      details: 'Awaiting payment authorization for $49.99',
    },
    {
      step: 'ORDER_SERVICE_UNAVAILABLE',
      label: 'Order Service Unavailable',
      timeStr: '--:--:--',
      status: 'pending',
      details: 'Simulated HTTP 503 Service Unavailable / Connection Refused',
    },
    {
      step: 'EVENT_PENDING',
      label: 'Event Pending (Outbox)',
      timeStr: '--:--:--',
      status: 'pending',
      details: 'Transactional outbox table buffers PAYMENT_CONFIRMED event',
    },
    {
      step: 'RETRY',
      label: 'Exponential Retry',
      timeStr: '--:--:--',
      status: 'pending',
      details: 'Background worker dispatches backoff retry attempt',
    },
    {
      step: 'ORDER_CREATED',
      label: 'Order Created',
      timeStr: '--:--:--',
      status: 'pending',
      details: 'Order Service back online; ORD-2026 committed safely',
    },
  ];

  // Dedicated Duplicate Request / Duplicate Event state for Scenarios 4 & 7
  private duplicateDemoState = {
    requestA: { processed: false, reservationId: '', paymentId: '', orderId: '' },
    duplicateA: { processed: false, intercepted: false, message: '' },
    eventDemo: {
      eventId: 'evt_idem_9041',
      dispatch1: { processed: false, timeStr: '' },
      dispatch2: { received: false, deduplicated: false, timeStr: '' },
    },
  };

  constructor() {
    for (const sc of INITIAL_FAILURE_SCENARIOS) {
      this.scenarios.set(sc.id, { ...sc });
    }
    this.seedInitialLogs();
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
        console.error('Error notifying failure simulation listener', err);
      }
    }
  }

  public getScenarios(): FailureScenario[] {
    return Array.from(this.scenarios.values());
  }

  public getScenario(id: FailureScenarioId): FailureScenario | undefined {
    return this.scenarios.get(id);
  }

  public getLogs(): FailureLogEntry[] {
    return [...this.logs];
  }

  public getOutboxSteps(): OutboxRetryStep[] {
    return [...this.outboxSteps];
  }

  public getDuplicateDemoState() {
    return { ...this.duplicateDemoState };
  }

  public addLog(
    scenarioId: FailureScenarioId,
    serviceTag: string,
    message: string,
    severity: FailureLogEntry['severity'] = 'INFO'
  ): void {
    const now = Date.now();
    const entry: FailureLogEntry = {
      id: `log-${this.logCounter++}`,
      scenarioId,
      timestamp: now,
      timeStr: formatTime(now),
      serviceTag,
      message,
      severity,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 250) {
      this.logs.pop();
    }
    this.notify();
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  public resetAllScenarios(): void {
    for (const sc of INITIAL_FAILURE_SCENARIOS) {
      this.scenarios.set(sc.id, { ...sc });
    }
    this.resetOutboxSteps();
    this.resetDuplicateDemo();
    this.seedInitialLogs();
    this.notify();
  }

  private resetOutboxSteps(): void {
    this.outboxSteps = [
      { step: 'PAYMENT_SUCCESS', label: 'Payment Success', timeStr: '--:--:--', status: 'pending', details: 'Awaiting payment authorization for $49.99' },
      { step: 'ORDER_SERVICE_UNAVAILABLE', label: 'Order Service Unavailable', timeStr: '--:--:--', status: 'pending', details: 'Simulated HTTP 503 Service Unavailable / Connection Refused' },
      { step: 'EVENT_PENDING', label: 'Event Pending (Outbox)', timeStr: '--:--:--', status: 'pending', details: 'Transactional outbox table buffers PAYMENT_CONFIRMED event' },
      { step: 'RETRY', label: 'Exponential Retry', timeStr: '--:--:--', status: 'pending', details: 'Background worker dispatches backoff retry attempt' },
      { step: 'ORDER_CREATED', label: 'Order Created', timeStr: '--:--:--', status: 'pending', details: 'Order Service back online; ORD-2026 committed safely' },
    ];
  }

  private resetDuplicateDemo(): void {
    this.duplicateDemoState = {
      requestA: { processed: false, reservationId: '', paymentId: '', orderId: '' },
      duplicateA: { processed: false, intercepted: false, message: '' },
      eventDemo: {
        eventId: 'evt_idem_' + Math.floor(1000 + Math.random() * 9000),
        dispatch1: { processed: false, timeStr: '' },
        dispatch2: { received: false, deduplicated: false, timeStr: '' },
      },
    };
  }

  /**
   * TRIGGER A SPECIFIC FAILURE SIMULATION
   */
  public async triggerScenario(scenarioId: FailureScenarioId): Promise<void> {
    const sc = this.scenarios.get(scenarioId);
    if (!sc) return;

    sc.status = 'SIMULATING';
    sc.lastRunTimestamp = Date.now();
    sc.actualResult = 'Simulation in progress...';
    this.notify();

    switch (scenarioId) {
      case 'PAYMENT_GATEWAY_TIMEOUT':
        await this.runPaymentGatewayTimeout(sc);
        break;
      case 'PAYMENT_GATEWAY_FAILURE':
        await this.runPaymentGatewayFailure(sc);
        break;
      case 'ORDER_SERVICE_DOWN':
        await this.runOrderServiceDown(sc);
        break;
      case 'DUPLICATE_PURCHASE_REQUEST':
        await this.runDuplicatePurchaseRequest(sc);
        break;
      case 'DUPLICATE_PAYMENT_REQUEST':
        await this.runDuplicatePaymentRequest(sc);
        break;
      case 'RESERVATION_EXPIRY':
        await this.runReservationExpiry(sc);
        break;
      case 'MESSAGE_DUPLICATION':
        await this.runMessageDuplication(sc);
        break;
      case 'REDIS_UNAVAILABLE':
        await this.runRedisUnavailable(sc);
        break;
      case 'INVENTORY_SERVICE_FAILURE':
        await this.runInventoryServiceFailure(sc);
        break;
    }

    this.notify();
  }

  /**
   * 1. Payment Gateway Timeout Simulation
   */
  private async runPaymentGatewayTimeout(sc: FailureScenario): Promise<void> {
    this.addLog(sc.id, 'PAYMENT', 'Customer usr_timeout initiated payment authorization for $49.99', 'INFO');
    await delay(500);

    this.addLog(sc.id, 'GATEWAY', 'HTTP POST /v1/charges sent to payment gateway (gateway_ref: gw_sim_timeout)', 'INFO');
    await delay(700);

    this.addLog(sc.id, 'GATEWAY', 'Simulated HTTP 504 Gateway Timeout: Gateway socket read timeout after 3000ms', 'WARN');
    this.addLog(sc.id, 'PAYMENT', 'Payment status marked TIMEOUT / RECONCILIATION_REQUIRED. Inventory lock preserved!', 'WARN');
    await delay(800);

    this.addLog(sc.id, 'RECONCILIATION', 'Scheduled reconciliation sweeper querying gateway transaction status by idempotency key', 'INFO');
    await delay(700);

    this.addLog(sc.id, 'GATEWAY', 'Gateway status check response: Charge was captured successfully (AUTH_CAPTURED)', 'SUCCESS');
    this.addLog(sc.id, 'PAYMENT', 'Payment successfully updated to SUCCESS. Confirmed order generated.', 'SUCCESS');

    sc.status = 'RECOVERED';
    sc.actualResult = 'Payment timed out -> Lock held in reconciliation -> Query confirmed charge -> Order confirmed with zero stock leak.';
  }

  /**
   * 2. Payment Gateway Failure Simulation
   */
  private async runPaymentGatewayFailure(sc: FailureScenario): Promise<void> {
    this.addLog(sc.id, 'PAYMENT', 'Customer usr_declined submitting card checkout ($49.99)', 'INFO');
    await delay(400);

    this.addLog(sc.id, 'GATEWAY', 'Simulated Card Decline: HTTP 402 Insufficient Funds / Bank Decline', 'ERROR');
    this.addLog(sc.id, 'PAYMENT', 'Payment marked FAILED. Triggering compensating inventory rollback.', 'WARN');
    await delay(600);

    this.addLog(sc.id, 'INVENTORY', 'Compensating transaction executed: 1 unit returned from Reserved to Available stock.', 'SUCCESS');
    this.addLog(sc.id, 'SAFETY', 'Conservation invariant verified: available + reserved + sold = 100 maintained.', 'SUCCESS');

    sc.status = 'RECOVERED';
    sc.actualResult = 'Payment failed gracefully -> Reservation lock released immediately -> Stock restored to available pool.';
  }

  /**
   * 3. Order Service Down Simulation (HIGHLIGHT)
   * Payment SUCCESS + Order Service DOWN
   * PAYMENT SUCCESS ↓ ORDER SERVICE UNAVAILABLE ↓ EVENT PENDING ↓ RETRY ↓ ORDER CREATED
   */
  public async runOrderServiceDown(sc?: FailureScenario): Promise<void> {
    const targetSc = sc || this.scenarios.get('ORDER_SERVICE_DOWN');
    if (targetSc) {
      targetSc.status = 'SIMULATING';
      targetSc.lastRunTimestamp = Date.now();
      targetSc.actualResult = 'Executing Outbox pattern retry lifecycle...';
      this.notify();
    }

    const now = Date.now();

    // Step 1: PAYMENT SUCCESS
    this.outboxSteps[0].status = 'active';
    this.outboxSteps[0].timeStr = formatTime(now);
    this.addLog('ORDER_SERVICE_DOWN', 'PAYMENT', 'Payment authorization returned SUCCESS (PAY-2026-OUTBOX)', 'SUCCESS');
    this.notify();
    await delay(700);
    this.outboxSteps[0].status = 'completed';

    // Step 2: ORDER SERVICE UNAVAILABLE
    const t2 = Date.now();
    this.outboxSteps[1].status = 'active';
    this.outboxSteps[1].timeStr = formatTime(t2);
    this.addLog('ORDER_SERVICE_DOWN', 'ORDER', 'Order service unavailable (Simulated 503 Connection Refused)', 'ERROR');
    this.notify();
    await delay(700);
    this.outboxSteps[1].status = 'failed';

    // Step 3: EVENT PENDING
    const t3 = Date.now();
    this.outboxSteps[2].status = 'active';
    this.outboxSteps[2].timeStr = formatTime(t3);
    this.addLog('ORDER_SERVICE_DOWN', 'OUTBOX', 'Payment preserved! Event queued in transactional pending buffer: evt_outbox_pay_confirmed', 'WARN');
    this.notify();
    await delay(800);
    this.outboxSteps[2].status = 'completed';

    // Step 4: RETRY
    const t4 = Date.now();
    this.outboxSteps[3].status = 'active';
    this.outboxSteps[3].timeStr = formatTime(t4);
    this.addLog('ORDER_SERVICE_DOWN', 'RETRY', 'Outbox retry worker dispatched attempt 1 with exponential backoff', 'INFO');
    this.notify();
    await delay(900);
    this.outboxSteps[3].status = 'completed';

    // Step 5: ORDER CREATED
    const t5 = Date.now();
    this.outboxSteps[4].status = 'active';
    this.outboxSteps[4].timeStr = formatTime(t5);
    this.addLog('ORDER_SERVICE_DOWN', 'ORDER', 'Order service recovered. Order created: ORD-2026-OUTBOX (Trace linked: RES → PAY → ORD)', 'SUCCESS');
    this.outboxSteps[4].status = 'completed';

    if (targetSc) {
      targetSc.status = 'RECOVERED';
      targetSc.actualResult = 'Payment survived Order Service outage. Transactional Outbox held event and retried successfully to create order.';
    }
    this.notify();
  }

  /**
   * 4. Duplicate Purchase Request Simulation (HIGHLIGHT)
   * Request A + Request A duplicate -> 1 reservation, 1 payment, 1 order
   */
  public async runDuplicatePurchaseRequest(sc?: FailureScenario): Promise<void> {
    const targetSc = sc || this.scenarios.get('DUPLICATE_PURCHASE_REQUEST');
    if (targetSc) {
      targetSc.status = 'SIMULATING';
      targetSc.lastRunTimestamp = Date.now();
      targetSc.actualResult = 'Deduplicating concurrent requests...';
      this.notify();
    }

    const key = `idem_req_${Math.random().toString(36).substring(2, 6)}`;
    const resId = `RES-DEMO-${Math.floor(100 + Math.random() * 900)}`;
    const payId = `PAY-DEMO-${Math.floor(100 + Math.random() * 900)}`;
    const ordId = `ORD-DEMO-${Math.floor(100 + Math.random() * 900)}`;

    // Request A
    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'CLIENT', `Purchase Request A received (Idempotency Key: ${key})`, 'INFO');
    await delay(500);

    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'INVENTORY', `Reservation allocated: ${resId} (1 unit locked)`, 'SUCCESS');
    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'PAYMENT', `Payment processed: ${payId} ($49.99)`, 'SUCCESS');
    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'ORDER', `Order confirmed: ${ordId}`, 'SUCCESS');

    this.duplicateDemoState.requestA = {
      processed: true,
      reservationId: resId,
      paymentId: payId,
      orderId: ordId,
    };
    this.notify();
    await delay(700);

    // Duplicate Request A
    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'CLIENT', `Network Retry: Duplicate Request A received with same Idempotency Key (${key})`, 'WARN');
    await delay(600);

    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'IDEMPOTENCY', `Duplicate key match detected (${key}). Intercepting duplicate charge & stock decrement.`, 'SUCCESS');
    this.addLog('DUPLICATE_PURCHASE_REQUEST', 'RESPONSE', `Replayed cached result: Returning existing ${resId}, ${payId}, ${ordId}. Exactly 1 unit sold.`, 'SUCCESS');

    this.duplicateDemoState.duplicateA = {
      processed: true,
      intercepted: true,
      message: `Duplicate safely intercepted. Reused original ${resId}, ${payId}, ${ordId}. Zero overselling!`,
    };

    if (targetSc) {
      targetSc.status = 'RECOVERED';
      targetSc.actualResult = 'Exactly 1 Reservation, 1 Payment, 1 Order generated. Duplicate request received cached commitment.';
    }
    this.notify();
  }

  /**
   * 5. Duplicate Payment Request Simulation
   */
  private async runDuplicatePaymentRequest(sc: FailureScenario): Promise<void> {
    const payKey = `idem_pay_rapid_${Math.random().toString(36).substring(2, 6)}`;
    this.addLog(sc.id, 'CLIENT', `Payment submit #1 received (Key: ${payKey})`, 'INFO');
    await delay(400);

    this.addLog(sc.id, 'PAYMENT', 'Card charge authorized ($49.99) -> PAY-RAPID-01 registered', 'SUCCESS');
    await delay(500);

    this.addLog(sc.id, 'CLIENT', `Rapid duplicate payment submit #2 received with identical key (${payKey})`, 'WARN');
    await delay(500);

    this.addLog(sc.id, 'IDEMPOTENCY', 'Idempotency index hit! Intercepted second charge before hitting bank gateway.', 'SUCCESS');
    this.addLog(sc.id, 'GATEWAY', 'Duplicate charges prevented: 0 additional bank transactions made.', 'SUCCESS');

    sc.status = 'RECOVERED';
    sc.actualResult = 'Customer charged once. Duplicate payment request received cached payment record.';
  }

  /**
   * 6. Reservation Expiry Simulation
   */
  private async runReservationExpiry(sc: FailureScenario): Promise<void> {
    const resId = `RES-EXP-${Math.floor(100 + Math.random() * 900)}`;
    this.addLog(sc.id, 'INVENTORY', `Customer reserved item: ${resId} (TTL set to 5 minutes)`, 'INFO');
    await delay(500);

    this.addLog(sc.id, 'CHECKOUT', 'User abandoned browser session; payment not initiated within TTL window', 'WARN');
    await delay(600);

    this.addLog(sc.id, 'SWEEPER', `TTL clock expired for ${resId}. Triggering auto-release reaper.`, 'INFO');
    this.addLog(sc.id, 'INVENTORY', `Reaper reclaimed 1 unit from ${resId} back to Available stock pool.`, 'SUCCESS');
    this.addLog(sc.id, 'SAFETY', 'Inventory conservation satisfied: Available incremented, 0 leaked inventory locks.', 'SUCCESS');

    sc.status = 'RECOVERED';
    sc.actualResult = 'Abandoned reservation automatically reaped and returned to available stock pool.';
  }

  /**
   * 7. Message/Event Duplication Simulation (HIGHLIGHT)
   * Send the same event twice. The consumer must process it idempotently.
   */
  public async runMessageDuplication(sc?: FailureScenario): Promise<void> {
    const targetSc = sc || this.scenarios.get('MESSAGE_DUPLICATION');
    if (targetSc) {
      targetSc.status = 'SIMULATING';
      targetSc.lastRunTimestamp = Date.now();
      targetSc.actualResult = 'Testing consumer idempotency against duplicate events...';
      this.notify();
    }

    const eventId = `evt_order_shipped_${Math.floor(1000 + Math.random() * 9000)}`;
    this.duplicateDemoState.eventDemo.eventId = eventId;

    // Dispatch 1
    const t1 = Date.now();
    this.addLog('MESSAGE_DUPLICATION', 'BROKER', `Event dispatched to Kafka topic [order.events]: ${eventId}`, 'INFO');
    await delay(600);

    this.addLog('MESSAGE_DUPLICATION', 'CONSUMER', `Worker 1 received ${eventId} -> Executing state transition to SHIPPED`, 'SUCCESS');
    this.addLog('MESSAGE_DUPLICATION', 'CONSUMER', `Event ${eventId} saved to processed_events deduplication table`, 'SUCCESS');
    this.duplicateDemoState.eventDemo.dispatch1 = { processed: true, timeStr: formatTime(t1) };
    this.notify();
    await delay(800);

    // Dispatch 2 (Duplicate redelivery)
    const t2 = Date.now();
    this.addLog('MESSAGE_DUPLICATION', 'BROKER', `Network timeout causes broker redelivery of duplicate event: ${eventId}`, 'WARN');
    await delay(600);

    this.addLog('MESSAGE_DUPLICATION', 'CONSUMER', `Worker 2 received duplicate ${eventId}. Querying processed_events table...`, 'INFO');
    this.addLog('MESSAGE_DUPLICATION', 'CONSUMER', `Dedup check: Event ${eventId} was already committed! Safely dropping duplicate.`, 'SUCCESS');
    this.addLog('MESSAGE_DUPLICATION', 'CONSUMER', 'Returned ACK 200 to message broker. Zero duplicate actions performed.', 'SUCCESS');

    this.duplicateDemoState.eventDemo.dispatch2 = { received: true, deduplicated: true, timeStr: formatTime(t2) };

    if (targetSc) {
      targetSc.status = 'RECOVERED';
      targetSc.actualResult = 'Duplicate event received and acknowledged, but dropped by consumer idempotency filter without double-processing.';
    }
    this.notify();
  }

  /**
   * 8. Redis Unavailable Simulation
   */
  private async runRedisUnavailable(sc: FailureScenario): Promise<void> {
    this.addLog(sc.id, 'INFRASTRUCTURE', 'Sending distributed lock lease request to Redis cluster', 'INFO');
    await delay(400);

    this.addLog(sc.id, 'REDIS', 'Simulated Redis Cluster Failure: Connection refused (ECONNREFUSED :6379)', 'ERROR');
    this.addLog(sc.id, 'CIRCUIT_BREAKER', 'Circuit breaker tripped to OPEN state for external cache provider', 'WARN');
    await delay(600);

    this.addLog(sc.id, 'FALLBACK', 'Graceful degradation: Activating in-memory pessimistic mutex lock', 'INFO');
    this.addLog(sc.id, 'INVENTORY', 'Synchronized in-memory mutex acquired lock for reservation. Zero overselling.', 'SUCCESS');

    sc.status = 'RECOVERED';
    sc.actualResult = 'Fallback to in-memory lock prevented downtime and maintained zero overselling guarantee.';
  }

  /**
   * 9. Inventory Service Failure Simulation
   */
  private async runInventoryServiceFailure(sc: FailureScenario): Promise<void> {
    this.addLog(sc.id, 'INVENTORY', 'Initiating multi-item inventory transaction in relational storage', 'INFO');
    await delay(500);

    this.addLog(sc.id, 'DATABASE', 'Simulated DB Error: Transaction deadlock / foreign key serialization failure', 'ERROR');
    this.addLog(sc.id, 'SAGA', 'Saga coordinator caught SQL error. Executing compensation rollback.', 'WARN');
    await delay(600);

    this.addLog(sc.id, 'INVENTORY', 'Rollback completed: All stock counters restored to original values.', 'SUCCESS');
    this.addLog(sc.id, 'SAFETY', 'Safety invariant: available + reserved + sold = 100 perfectly maintained.', 'SUCCESS');

    sc.status = 'RECOVERED';
    sc.actualResult = 'Transaction deadlock handled with atomic compensation rollback. Invariants conserved.';
  }

  /**
   * Trigger all 9 scenarios sequentially
   */
  public async triggerAllScenarios(): Promise<void> {
    for (const sc of this.scenarios.values()) {
      await this.triggerScenario(sc.id);
      await delay(300);
    }
  }

  private seedInitialLogs(): void {
    const now = Date.now();
    this.logs = [
      {
        id: 'log-seed-1',
        scenarioId: 'ORDER_SERVICE_DOWN',
        timestamp: now - 35000,
        timeStr: formatTime(now - 35000),
        serviceTag: 'PAYMENT',
        message: 'Payment authorization success for $49.99 (PAY-2026-0091)',
        severity: 'SUCCESS',
      },
      {
        id: 'log-seed-2',
        scenarioId: 'ORDER_SERVICE_DOWN',
        timestamp: now - 34000,
        timeStr: formatTime(now - 34000),
        serviceTag: 'ORDER',
        message: 'Order service unavailable (HTTP 503 Connection Refused)',
        severity: 'ERROR',
      },
      {
        id: 'log-seed-3',
        scenarioId: 'ORDER_SERVICE_DOWN',
        timestamp: now - 33000,
        timeStr: formatTime(now - 33000),
        serviceTag: 'OUTBOX',
        message: 'Payment preserved! Event queued in transactional pending buffer: evt_outbox_pay_confirmed',
        severity: 'WARN',
      },
      {
        id: 'log-seed-4',
        scenarioId: 'ORDER_SERVICE_DOWN',
        timestamp: now - 31000,
        timeStr: formatTime(now - 31000),
        serviceTag: 'RETRY',
        message: 'Outbox retry worker dispatched attempt 1 with exponential backoff',
        severity: 'INFO',
      },
      {
        id: 'log-seed-5',
        scenarioId: 'ORDER_SERVICE_DOWN',
        timestamp: now - 30000,
        timeStr: formatTime(now - 30000),
        serviceTag: 'ORDER',
        message: 'Order service recovered. Order created: ORD-2026-OUTBOX (Trace linked: RES → PAY → ORD)',
        severity: 'SUCCESS',
      },
    ];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const failureSimulationService = new FailureSimulationService();
