import { reservationService } from './reservationService';
import { paymentService } from './paymentService';
import { orderService } from './orderService';
import { failureSimulationService } from './failureSimulationService';

type Listener = () => void;

class GlobalDemoService {
  private demoMode: boolean = true; // Enabled by default for easy hackathon jury demonstration
  private listeners: Set<Listener> = new Set();

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
        console.error('Error notifying global demo listener', err);
      }
    }
  }

  public isDemoMode(): boolean {
    return this.demoMode;
  }

  public toggleDemoMode(): void {
    this.demoMode = !this.demoMode;
    this.notify();
  }

  public setDemoMode(val: boolean): void {
    this.demoMode = val;
    this.notify();
  }

  /**
   * RESET SIMULATION
   * Completely restores:
   * Inventory = 100 available, 0 reserved, 0 sold
   * Reservations = 0
   * Payments = 0
   * Orders = 0
   * Failures = 0
   * Metrics = reset
   */
  public resetSimulation(): void {
    reservationService.resetStore();
    paymentService.resetPayments();
    orderService.resetOrders();
    failureSimulationService.resetAllScenarios();
    this.notify();
  }

  /**
   * Quick Action 1: Start Flash Sale (Reserve a unit)
   */
  public async quickStartFlashSale(): Promise<string> {
    const custId = `usr_demo_${Math.floor(100 + Math.random() * 900)}`;
    const res = reservationService.reserveInventory({
      customerId: custId,
      quantity: 1,
      idempotencyKey: `idem_demo_${Date.now()}`,
      ttlSeconds: 300,
    });
    this.notify();
    return res.message;
  }

  /**
   * Quick Action 2: Run 10K Simulation
   */
  public async quickRun10KSimulation(): Promise<{ processed: number; successful: number; oversold: number }> {
    // Generate 10,000 requests and process via reservationService
    const requests = Array.from({ length: 10000 }, (_, i) => ({
      requestId: `req_demo_${i + 1}`,
      customerId: `cust_demo_${i + 1}`,
      productId: 'fg-ltd-01',
      quantity: 1,
      idempotencyKey: `idem_demo_10k_${i + 1}`,
      timestamp: Date.now(),
    }));

    const batchResult = reservationService.processSimulatedBatch(requests);
    const successful = batchResult.results.filter((r) => r.success).length;
    const oversold = Math.max(0, batchResult.inventory.sold + batchResult.inventory.reserved - batchResult.inventory.total);
    this.notify();
    return {
      processed: 10000,
      successful,
      oversold,
    };
  }

  /**
   * Quick Action 3: Simulate Payment Failure
   */
  public async quickSimulatePaymentFailure(): Promise<void> {
    await failureSimulationService.triggerScenario('PAYMENT_GATEWAY_FAILURE');
    this.notify();
  }

  /**
   * Quick Action 4: Simulate Order Failure
   */
  public async quickSimulateOrderFailure(): Promise<void> {
    await failureSimulationService.triggerScenario('ORDER_SERVICE_DOWN');
    this.notify();
  }

  /**
   * Quick Action 5: Expire Reservation
   */
  public async quickExpireReservation(): Promise<void> {
    await failureSimulationService.triggerScenario('RESERVATION_EXPIRY');
    this.notify();
  }
}

export const globalDemoService = new GlobalDemoService();
