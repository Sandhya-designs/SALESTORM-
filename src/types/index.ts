export type SystemStatusType = 'READY' | 'ACTIVE' | 'PAUSED' | 'DEGRADED';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  phase: number;
  badge?: string;
}

export interface MetricData {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status: 'normal' | 'active' | 'warning' | 'critical' | 'ready';
  change?: string;
  description: string;
  iconName: string;
}

export interface ArchitectureStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: 'active' | 'standby' | 'disabled';
  iconName: string;
  latency?: string;
}

export interface CoreGuarantee {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  statusText: string;
  keyPoints: string[];
}

export type SimulationSpeed = 'Slow' | 'Normal' | 'Fast' | 'Instant';

export interface FlashSaleConfig {
  productName: string;
  totalInventory: number;
  reservationDurationSec: number;
  concurrentUsers: number;
  simulationSpeed: SimulationSpeed;
}

export type FlashSaleStatus = 'SALE READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface FlashSaleMetrics {
  requestsReceived: number;
  successfulReservations: number;
  failedReservations: number;
  availableStock: number;
  activeReservations: number;
  paymentsPending: number;
  ordersConfirmed: number;
  progressPercent: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface SimulationTrafficSample {
  id: string;
  userId: string;
  timestamp: string;
  stage: 'Rate Limiter' | 'Inventory Decision' | 'Reservation' | 'Payment' | 'Order Confirmed' | 'Rejected';
  result: 'SUCCESS' | 'RESERVED' | 'RATE_LIMITED' | 'SOLD_OUT';
  latencyMs: number;
}

// ==================================================
// PHASE 3: INVENTORY & RESERVATION DOMAIN TYPES
// ==================================================

export type ReservationStatus =
  | 'RESERVED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'RELEASED'
  | 'EXPIRED'
  | 'FAILED';

export interface ProductInventory {
  productId: string;
  productName: string;
  total: number;
  available: number;
  reserved: number;
  sold: number;
}

export interface Reservation {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  createdAt: number;
  expiresAt: number;
  idempotencyKey: string;
  failureReason?: string;
}

export interface ReserveRequest {
  customerId: string;
  productId?: string;
  quantity: number;
  idempotencyKey: string;
  ttlSeconds?: number;
}

export interface ReserveResult {
  success: boolean;
  reservation: Reservation;
  isIdempotentReplay: boolean;
  message: string;
}

export type InventoryTransactionType =
  | 'RESERVE_SUCCESS'
  | 'RESERVE_FAILED'
  | 'RELEASE'
  | 'CONFIRM'
  | 'EXPIRE'
  | 'RESET';

export interface InventoryTransaction {
  id: string;
  timestamp: number;
  type: InventoryTransactionType;
  reservationId: string;
  customerId: string;
  quantity: number;
  status: ReservationStatus;
  availableBefore: number;
  availableAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  soldBefore: number;
  soldAfter: number;
  details: string;
}

// ==================================================
// PHASE 4: 10,000 CONCURRENCY SIMULATION TYPES
// ==================================================

export interface SimulatedPurchaseRequest {
  requestId: string;
  customerId: string;
  productId: string;
  quantity: number;
  idempotencyKey: string;
  timestamp: number;
}

export type SimulationLiveEventType =
  | 'REQUEST_RECEIVED'
  | 'RESERVATION_SUCCESS'
  | 'RESERVATION_FAILED'
  | 'OUT_OF_STOCK';

export interface SimulationLiveEvent {
  id: string;
  requestId: string;
  customerId: string;
  type: SimulationLiveEventType;
  message: string;
  timestamp: number;
  stockRemaining: number;
}

export interface SimulationStats {
  requestsProcessed: number;
  totalRequests: number;
  successfulReservations: number;
  failedReservations: number;
  remainingInventory: number;
  oversold: number;
  duplicateReservations: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  startTime: number | null;
  elapsedMs: number;
  batchRate: number;
}

export interface InventorySafetyChecks {
  reservationsUnderLimit: boolean; // Successful reservations <= total inventory (100)
  availableNonNegative: boolean; // Available inventory >= 0
  noDuplicateKeys: boolean; // No duplicate idempotency keys
  noOverselling: boolean; // Oversold === 0
  conservationInvariant: boolean; // Reserved + available + sold === total (100)
}

// ==================================================
// PHASE 5: LOCAL PAYMENT SIMULATION TYPES
// ==================================================

export type PaymentStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT'
  | 'RECONCILIATION_REQUIRED';

export interface PaymentRecord {
  id: string;
  reservationId: string;
  customerId: string;
  amount: number;
  status: PaymentStatus;
  idempotencyKey: string;
  createdAt: number;
  updatedAt: number;
  gatewayRef?: string;
  failureReason?: string;
}

export interface PaymentSimulationConfig {
  successRate: number; // default 95
  failureRate: number; // default 5
  timeoutRate: number; // default 0
}

export interface SimulatePaymentRequest {
  reservationId: string;
  customerId: string;
  amount: number;
  idempotencyKey: string;
  forcedOutcome?: 'AUTO' | 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
}

export interface SimulatePaymentResult {
  payment: PaymentRecord;
  isIdempotentReplay: boolean;
  reservationStatusBefore: string;
  reservationStatusAfter: string;
  message: string;
}

// ==================================================
// PHASE 6: ORDER LIFECYCLE & TRACEABILITY TYPES
// ==================================================

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: number;
  note: string;
}

export interface OrderRecord {
  id: string;
  reservationId: string;
  paymentId: string;
  customerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: number;
  updatedAt: number;
  shippingAddress?: string;
}

// ==================================================
// PHASE 7: FAILURE SIMULATION & RESILIENCE TYPES
// ==================================================

export type FailureScenarioId =
  | 'PAYMENT_GATEWAY_TIMEOUT'
  | 'PAYMENT_GATEWAY_FAILURE'
  | 'ORDER_SERVICE_DOWN'
  | 'DUPLICATE_PURCHASE_REQUEST'
  | 'DUPLICATE_PAYMENT_REQUEST'
  | 'RESERVATION_EXPIRY'
  | 'MESSAGE_DUPLICATION'
  | 'REDIS_UNAVAILABLE'
  | 'INVENTORY_SERVICE_FAILURE';

export type FailureCategory =
  | 'PAYMENT'
  | 'ORDER'
  | 'CONCURRENCY'
  | 'EVENT'
  | 'INFRASTRUCTURE'
  | 'INVENTORY';

export type FailureStatus = 'IDLE' | 'SIMULATING' | 'RECOVERED' | 'FAILED';

export interface FailureScenario {
  id: FailureScenarioId;
  name: string;
  category: FailureCategory;
  description: string;
  expectedRecovery: string;
  recoveryFlow: string[];
  status: FailureStatus;
  actualResult: string | null;
  lastRunTimestamp: number | null;
}

export interface FailureLogEntry {
  id: string;
  scenarioId: FailureScenarioId;
  timestamp: number;
  timeStr: string;
  serviceTag: string;
  message: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}

export interface OutboxRetryStep {
  step: 'PAYMENT_SUCCESS' | 'ORDER_SERVICE_UNAVAILABLE' | 'EVENT_PENDING' | 'RETRY' | 'ORDER_CREATED';
  label: string;
  timeStr: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  details: string;
}

// ==================================================
// PHASE 8: INTERACTIVE SYSTEM ARCHITECTURE TYPES
// ==================================================

export type ArchitectureComponentId =
  | 'customer'
  | 'cdn'
  | 'waf'
  | 'load_balancer'
  | 'api_gateway'
  | 'rate_limiter'
  | 'product_service'
  | 'cart_service'
  | 'checkout_service'
  | 'inventory_service'
  | 'reservation_service'
  | 'payment_service'
  | 'order_service'
  | 'shipment_service'
  | 'notification_service'
  | 'redis'
  | 'sql_database'
  | 'message_broker'
  | 'observability';

export type ArchitectureFlowMode =
  | 'NORMAL_FLOW'
  | 'PURCHASE_FLOW'
  | 'PAYMENT_FAILURE'
  | 'ORDER_FAILURE'
  | 'RESERVATION_EXPIRY';

export interface ArchitectureComponentData {
  id: ArchitectureComponentId;
  name: string;
  category: 'INGRESS' | 'CORE_SERVICE' | 'FULFILLMENT' | 'INFRASTRUCTURE';
  tierLabel: string;
  isSimulatedInFlashGuard: boolean;
  responsibilities: string[];
  data: string[];
  criticalGuarantee: string;
  failureHandling: string;
  scaling: string;
  flowRoles: Record<ArchitectureFlowMode, string | null>;
  iconName: string;
}

export interface FlowModeConfig {
  id: ArchitectureFlowMode;
  name: string;
  badge: string;
  color: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  description: string;
  stepSequence: { step: number; componentId: ArchitectureComponentId; action: string }[];
  activeComponentIds: ArchitectureComponentId[];
}

// ==================================================
// PHASE 9: OBSERVABILITY & TELEMETRY TYPES
// ==================================================

export type ServiceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface ServiceHealthItem {
  id: string;
  name: string;
  status: ServiceHealthStatus;
  latencyMs: number;
  uptime: string;
  details: string;
}

export type AlertLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SystemAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: number;
  active: boolean;
}

export interface TraceSpan {
  requestId: string;
  reservationId: string;
  paymentId: string;
  orderId: string;
  customerId: string;
  requestTime: number;
  reservationTime: number;
  paymentTime: number;
  orderTime: number;
  totalDurationMs: number;
  status: 'CONFIRMED' | 'REVERTED' | 'FAILED';
}

export interface ObservabilityMetrics {
  requestsPerSec: number;
  successfulReservations: number;
  failedReservations: number;
  currentAvailableInventory: number;
  currentReservedInventory: number;
  currentSoldInventory: number;
  reservationExpiryRate: number;
  paymentSuccessRate: number;
  paymentFailureRate: number;
  orderConversionRate: number;
  avgProcessingTimeMs: number;
  p95LatencyMs: number;
  queueBacklog: number;
  systemErrors: number;
  oversold: number;
}






