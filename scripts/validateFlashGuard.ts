import { reservationService } from '../src/services/reservationService.ts';
import { paymentService } from '../src/services/paymentService.ts';
import { orderService } from '../src/services/orderService.ts';
import { failureSimulationService } from '../src/services/failureSimulationService.ts';
import { globalDemoService } from '../src/services/globalDemoService.ts';
import { observabilityService } from '../src/services/observabilityService.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runValidation() {
  console.log('==================================================');
  console.log('   FLASHGUARD: COMPLETE APPLICATION TEST SUITE');
  console.log('==================================================\n');

  // ==================================================
  // TEST 1 — INVENTORY INVARIANT
  // ==================================================
  console.log('▶ TEST 1 — INVENTORY INVARIANT');
  globalDemoService.resetSimulation();

  let inv = reservationService.getInventory();
  assert(inv.total === 100, 'Initial Total = 100');
  assert(inv.available === 100, 'Initial Available = 100');
  assert(inv.reserved === 0, 'Initial Reserved = 0');
  assert(inv.sold === 0, 'Initial Sold = 0');
  assert(inv.available + inv.reserved + inv.sold === inv.total, 'Conservation: available + reserved + sold = total');

  console.log('  Executing 10,000 purchase simulation...');
  const requests = Array.from({ length: 10000 }, (_, i) => ({
    requestId: `req_test1_${i + 1}`,
    customerId: `cust_test1_${i + 1}`,
    productId: 'fg-ltd-01',
    quantity: 1,
    idempotencyKey: `idem_test1_${i + 1}`,
    timestamp: Date.now(),
  }));

  const batchResult = reservationService.processSimulatedBatch(requests);
  const successfulReservations = batchResult.results.filter((r) => r.success).length;
  const failedReservations = batchResult.results.filter((r) => !r.success).length;

  inv = reservationService.getInventory();
  assert(successfulReservations === 100, `Successful reservations = ${successfulReservations} (Expected: 100)`);
  assert(failedReservations === 9900, `Failed reservations = ${failedReservations} (Expected: 9900)`);
  assert(inv.available === 0, `Available inventory = ${inv.available} (Expected: 0)`);
  assert(inv.reserved === 100, `Reserved inventory = ${inv.reserved} (Expected: 100)`);

  const oversold = Math.max(0, inv.sold + inv.reserved - inv.total);
  assert(oversold === 0, `Oversold = ${oversold} (Zero Overselling Guarantee verified)`);
  assert(inv.available + inv.reserved + inv.sold === inv.total, 'Conservation: available + reserved + sold = total satisfied');
  console.log('✅ TEST 1 PASSED\n');

  // ==================================================
  // TEST 2 — DUPLICATE REQUEST
  // ==================================================
  console.log('▶ TEST 2 — DUPLICATE REQUEST');
  globalDemoService.resetSimulation();

  const customerId = 'cust_test2_dup';
  const sharedKey = 'idem_key_dup_exact_99';

  // First submission
  const res1 = reservationService.reserveInventory({
    customerId,
    quantity: 1,
    idempotencyKey: sharedKey,
    ttlSeconds: 300,
  });
  assert(res1.success, 'First request acquired reservation');
  assert(!res1.isIdempotentReplay, 'First request was new execution');

  inv = reservationService.getInventory();
  assert(inv.available === 99 && inv.reserved === 1, 'Inventory decremented once (Available: 99, Reserved: 1)');

  // Duplicate submission with identical key
  const res2 = reservationService.reserveInventory({
    customerId,
    quantity: 1,
    idempotencyKey: sharedKey,
    ttlSeconds: 300,
  });
  assert(res2.success, 'Second request succeeded via idempotent replay');
  assert(res2.isIdempotentReplay, 'Second request identified as idempotent replay');
  assert(res1.reservation.id === res2.reservation.id, `Reused original reservation ID (${res1.reservation.id})`);

  inv = reservationService.getInventory();
  assert(inv.available === 99 && inv.reserved === 1, 'Inventory unchanged: Exactly 1 reservation allocated');
  console.log('✅ TEST 2 PASSED\n');

  // ==================================================
  // TEST 3 — RESERVATION EXPIRY
  // ==================================================
  console.log('▶ TEST 3 — RESERVATION EXPIRY');
  globalDemoService.resetSimulation();

  const resExpire = reservationService.reserveInventory({
    customerId: 'cust_test3_expire',
    quantity: 1,
    idempotencyKey: 'idem_test3_exp',
    ttlSeconds: 300,
  });
  assert(resExpire.success, 'Created reservation for expiry test');

  inv = reservationService.getInventory();
  assert(inv.available === 99 && inv.reserved === 1, 'Pre-expiry inventory: Available=99, Reserved=1');

  // Force expiry
  const expiredOk = reservationService.expireReservation(resExpire.reservation.id);
  assert(expiredOk, 'expireReservation executed successfully');

  const reapedRes = reservationService.getReservations().find((r) => r.id === resExpire.reservation.id);
  assert(reapedRes?.status === 'EXPIRED', 'Reservation status = EXPIRED');

  inv = reservationService.getInventory();
  assert(inv.available === 100 && inv.reserved === 0, 'Inventory released back to Available (Available: 100, Reserved: 0)');
  assert(inv.available + inv.reserved + inv.sold === inv.total, 'Conservation invariant satisfied after expiry');
  console.log('✅ TEST 3 PASSED\n');

  // ==================================================
  // TEST 4 — PAYMENT FAILURE
  // ==================================================
  console.log('▶ TEST 4 — PAYMENT FAILURE');
  globalDemoService.resetSimulation();

  const resForFail = reservationService.reserveInventory({
    customerId: 'cust_test4_payfail',
    quantity: 1,
    idempotencyKey: 'idem_test4_fail',
    ttlSeconds: 300,
  });
  assert(resForFail.success, 'Created reservation for payment failure test');

  // Trigger simulated payment failure
  const payFailResult = await paymentService.simulatePayment({
    reservationId: resForFail.reservation.id,
    customerId: 'cust_test4_payfail',
    amount: 49.99,
    idempotencyKey: 'pay_idem_fail_1',
    forcedOutcome: 'FAILURE',
  });

  assert(payFailResult.payment.status === 'FAILED', 'Payment status = FAILED');
  const targetResFail = reservationService.getReservations().find((r) => r.id === resForFail.reservation.id);
  assert(targetResFail?.status === 'RELEASED', 'Reservation status = RELEASED');

  inv = reservationService.getInventory();
  assert(inv.available === 100 && inv.reserved === 0, 'Inventory returned to Available (Available: 100, Reserved: 0)');
  const ordersAfterFail = orderService.getOrders().filter((o) => o.reservationId === resForFail.reservation.id);
  assert(ordersAfterFail.length === 0, 'No confirmed order created for failed payment');
  console.log('✅ TEST 4 PASSED\n');

  // ==================================================
  // TEST 5 — PAYMENT SUCCESS
  // ==================================================
  console.log('▶ TEST 5 — PAYMENT SUCCESS');
  globalDemoService.resetSimulation();

  const resForSuccess = reservationService.reserveInventory({
    customerId: 'cust_test5_paysuccess',
    quantity: 1,
    idempotencyKey: 'idem_test5_success',
    ttlSeconds: 300,
  });
  assert(resForSuccess.success, 'Created reservation for payment success test');

  // Trigger simulated payment success
  const paySuccessResult = await paymentService.simulatePayment({
    reservationId: resForSuccess.reservation.id,
    customerId: 'cust_test5_paysuccess',
    amount: 49.99,
    idempotencyKey: 'pay_idem_success_1',
    forcedOutcome: 'SUCCESS',
  });

  assert(paySuccessResult.payment.status === 'SUCCESS', 'Payment status = SUCCESS');
  const targetResSuccess = reservationService.getReservations().find((r) => r.id === resForSuccess.reservation.id);
  assert(targetResSuccess?.status === 'CONFIRMED', 'Reservation status = CONFIRMED');

  const ordersSuccess = orderService.getOrders().filter((o) => o.reservationId === resForSuccess.reservation.id);
  assert(ordersSuccess.length === 1, 'Confirmed order created');
  assert(ordersSuccess[0].orderStatus === 'CONFIRMED', 'Order status = CONFIRMED');

  inv = reservationService.getInventory();
  assert(inv.sold === 1 && inv.reserved === 0 && inv.available === 99, 'Inventory committed: Sold=1, Reserved=0, Available=99');
  assert(inv.available + inv.reserved + inv.sold === inv.total, 'Conservation invariant satisfied: 99 + 0 + 1 = 100');
  console.log('✅ TEST 5 PASSED\n');

  // ==================================================
  // TEST 6 — PAYMENT TIMEOUT
  // ==================================================
  console.log('▶ TEST 6 — PAYMENT TIMEOUT');
  globalDemoService.resetSimulation();

  const resForTimeout = reservationService.reserveInventory({
    customerId: 'cust_test6_timeout',
    quantity: 1,
    idempotencyKey: 'idem_test6_timeout',
    ttlSeconds: 300,
  });
  assert(resForTimeout.success, 'Created reservation for timeout test');

  // Trigger payment timeout
  const payTimeoutResult = await paymentService.simulatePayment({
    reservationId: resForTimeout.reservation.id,
    customerId: 'cust_test6_timeout',
    amount: 49.99,
    idempotencyKey: 'pay_idem_timeout_1',
    forcedOutcome: 'TIMEOUT',
  });

  assert(payTimeoutResult.payment.status === 'RECONCILIATION_REQUIRED', 'Payment status = RECONCILIATION_REQUIRED');
  const targetResTimeout = reservationService.getReservations().find((r) => r.id === resForTimeout.reservation.id);
  assert(targetResTimeout?.status === 'PAYMENT_PENDING', 'Reservation lock preserved in PAYMENT_PENDING state');

  inv = reservationService.getInventory();
  assert(inv.reserved === 1 && inv.available === 99, 'Inventory hold not released during timeout');
  assert(inv.sold === 0, 'Inventory not marked as sold blindly');
  console.log('✅ TEST 6 PASSED\n');

  // ==================================================
  // TEST 7 — ORDER SERVICE FAILURE
  // ==================================================
  console.log('▶ TEST 7 — ORDER SERVICE FAILURE');
  globalDemoService.resetSimulation();

  // Run Order Service Down chaos scenario
  await failureSimulationService.runOrderServiceDown();
  const outboxSteps = failureSimulationService.getOutboxSteps();

  assert(outboxSteps[0].status === 'completed', 'Step 1: Payment Success verified');
  assert(outboxSteps[1].status === 'failed', 'Step 2: Order Service Unavailable (Simulated 503) verified');
  assert(outboxSteps[2].status === 'completed', 'Step 3: Event Pending in Transactional Outbox buffer verified');
  assert(outboxSteps[3].status === 'completed', 'Step 4: Retry worker executed exponential backoff verified');
  assert(outboxSteps[4].status === 'completed', 'Step 5: Order Created upon recovery verified');

  const orderScenario = failureSimulationService.getScenario('ORDER_SERVICE_DOWN');
  assert(orderScenario?.status === 'RECOVERED', 'Chaos scenario status = RECOVERED');
  console.log('✅ TEST 7 PASSED\n');

  // ==================================================
  // TEST 8 — DUPLICATE EVENT
  // ==================================================
  console.log('▶ TEST 8 — DUPLICATE EVENT');
  globalDemoService.resetSimulation();

  // Run duplicate event simulation
  await failureSimulationService.runMessageDuplication();
  const dupState = failureSimulationService.getDuplicateDemoState();

  assert(dupState.eventDemo.dispatch1.processed, 'First event dispatch processed');
  assert(dupState.eventDemo.dispatch2.received, 'Second duplicate event received by broker');
  assert(dupState.eventDemo.dispatch2.deduplicated, 'Second duplicate event deduplicated and dropped idempotently');
  console.log('✅ TEST 8 PASSED\n');

  // ==================================================
  // TEST 9 — RESET
  // ==================================================
  console.log('▶ TEST 9 — RESET');
  globalDemoService.resetSimulation();

  inv = reservationService.getInventory();
  assert(inv.total === 100, 'Reset: Total = 100');
  assert(inv.available === 100, 'Reset: Available = 100');
  assert(inv.reserved === 0, 'Reset: Reserved = 0');
  assert(inv.sold === 0, 'Reset: Sold = 0');

  const remainingReservations = reservationService.getReservations();
  assert(remainingReservations.length === 0, 'Reset: Reservations = 0');

  const remainingPayments = paymentService.getPayments();
  assert(remainingPayments.length === 0, 'Reset: Payments = 0');

  const remainingOrders = orderService.getOrders();
  assert(remainingOrders.length === 0, 'Reset: Orders = 0');

  const metrics = observabilityService.getMetrics();
  assert(metrics.oversold === 0, 'Reset: Oversold = 0');
  assert(metrics.systemErrors === 0, 'Reset: System Errors = 0');

  console.log('✅ TEST 9 PASSED\n');

  console.log('==================================================');
  console.log('   ALL 9 VALIDATION TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

runValidation().catch((err) => {
  console.error('Validation script failed with error:', err);
  process.exit(1);
});
