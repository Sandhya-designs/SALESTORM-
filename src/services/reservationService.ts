import type {
  ProductInventory,
  Reservation,
  ReserveRequest,
  ReserveResult,
  InventoryTransaction,
} from '../types';

export const INITIAL_PRODUCT_INVENTORY: ProductInventory = {
  productId: 'fg-ltd-01',
  productName: 'FlashGuard Limited Product',
  total: 100,
  available: 100,
  reserved: 0,
  sold: 0,
};

type Listener = () => void;

class ReservationService {
  private inventory: ProductInventory = { ...INITIAL_PRODUCT_INVENTORY };
  private reservations: Map<string, Reservation> = new Map();
  // Map of customerId:idempotencyKey -> reservationId
  private idempotencyIndex: Map<string, string> = new Map();
  private transactions: InventoryTransaction[] = [];
  private listeners: Set<Listener> = new Set();
  private timerInterval: number | null = null;
  private txCounter: number = 1;

  constructor() {
    this.startExpiryTimer();
  }

  public stopExpiryTimer(): void {
    if (this.timerInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
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
        console.error('Error notifying reservation listener', err);
      }
    }
  }

  public getInventory(): ProductInventory {
    // Defensive copy with guarantee check
    this.assertInvariants();
    return { ...this.inventory };
  }

  public getReservations(): Reservation[] {
    return Array.from(this.reservations.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  public getTransactions(): InventoryTransaction[] {
    return [...this.transactions].reverse();
  }

  /**
   * System invariant validation:
   * available + reserved + sold = total
   * available >= 0, reserved >= 0, sold <= total
   */
  private assertInvariants(): void {
    const { available, reserved, sold, total } = this.inventory;
    const sum = available + reserved + sold;
    if (sum !== total) {
      console.error(
        `CRITICAL INVARIANT VIOLATION: ${available} + ${reserved} + ${sold} = ${sum} !== ${total}`
      );
    }
    if (available < 0 || reserved < 0 || sold > total) {
      console.error(
        `OUT OF BOUNDS INVENTORY STATE: available=${available}, reserved=${reserved}, sold=${sold}, total=${total}`
      );
    }
  }

  /**
   * ATOMIC & IDEMPOTENT RESERVE OPERATION
   * 1. Check idempotency: If customer + idempotencyKey exists, return previous reservation without altering inventory.
   * 2. Atomic check: available >= requested quantity.
   * 3. Mutate inventory: available -= quantity; reserved += quantity.
   */
  public reserveInventory(req: ReserveRequest): ReserveResult {
    const { customerId, quantity, idempotencyKey } = req;
    const ttlSeconds = req.ttlSeconds && req.ttlSeconds > 0 ? req.ttlSeconds : 120; // default 2 minutes (120s)
    const productId = req.productId || this.inventory.productId;

    // 1. Idempotency Check
    const idempotencyId = `${customerId.trim().toLowerCase()}:${idempotencyKey.trim()}`;
    const existingResId = this.idempotencyIndex.get(idempotencyId);

    if (existingResId) {
      const existingRes = this.reservations.get(existingResId);
      if (existingRes) {
        return {
          success: existingRes.status === 'RESERVED' || existingRes.status === 'PAYMENT_PENDING' || existingRes.status === 'CONFIRMED',
          reservation: { ...existingRes },
          isIdempotentReplay: true,
          message: `Idempotency match: Replayed existing reservation (${existingRes.status}) without stock deduction.`,
        };
      }
    }

    const now = Date.now();
    const reservationId = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 2. Atomic Inventory Availability Check
    if (quantity <= 0) {
      const failedRes: Reservation = {
        id: reservationId,
        customerId,
        productId,
        quantity,
        status: 'FAILED',
        createdAt: now,
        expiresAt: now,
        idempotencyKey,
        failureReason: 'Requested quantity must be at least 1 unit.',
      };
      this.reservations.set(reservationId, failedRes);
      this.idempotencyIndex.set(idempotencyId, reservationId);
      this.recordTransaction('RESERVE_FAILED', failedRes, 'Failed: Invalid quantity');
      this.notify();
      return {
        success: false,
        reservation: failedRes,
        isIdempotentReplay: false,
        message: 'Reservation rejected: Invalid quantity.',
      };
    }

    if (this.inventory.available < quantity) {
      const failedRes: Reservation = {
        id: reservationId,
        customerId,
        productId,
        quantity,
        status: 'FAILED',
        createdAt: now,
        expiresAt: now,
        idempotencyKey,
        failureReason: `Insufficient available stock (${this.inventory.available} units remaining, requested ${quantity}).`,
      };
      this.reservations.set(reservationId, failedRes);
      this.idempotencyIndex.set(idempotencyId, reservationId);
      this.recordTransaction('RESERVE_FAILED', failedRes, `Failed: Out of stock (requested ${quantity}, available ${this.inventory.available})`);
      this.notify();
      return {
        success: false,
        reservation: failedRes,
        isIdempotentReplay: false,
        message: `Reservation rejected: Insufficient stock (Available: ${this.inventory.available}).`,
      };
    }

    // 3. Atomic Allocation
    const availBefore = this.inventory.available;
    const resBefore = this.inventory.reserved;

    this.inventory.available -= quantity;
    this.inventory.reserved += quantity;

    const expiresAt = now + ttlSeconds * 1000;
    const newReservation: Reservation = {
      id: reservationId,
      customerId,
      productId,
      quantity,
      status: 'RESERVED',
      createdAt: now,
      expiresAt,
      idempotencyKey,
    };

    this.reservations.set(reservationId, newReservation);
    this.idempotencyIndex.set(idempotencyId, reservationId);

    this.recordTransaction(
      'RESERVE_SUCCESS',
      newReservation,
      `Allocated ${quantity} units (Available: ${availBefore} -> ${this.inventory.available}, Reserved: ${resBefore} -> ${this.inventory.reserved})`
    );

    this.assertInvariants();
    this.notify();

    return {
      success: true,
      reservation: { ...newReservation },
      isIdempotentReplay: false,
      message: `Reservation acquired for ${quantity} unit(s). Expiring in ${ttlSeconds}s.`,
    };
  }

  /**
   * Release reservation manually or on cart abandonment
   * Status: RESERVED / PAYMENT_PENDING -> RELEASED
   * Inventory: available += quantity; reserved -= quantity
   */
  public releaseReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res) return false;

    if (res.status !== 'RESERVED' && res.status !== 'PAYMENT_PENDING') {
      return false;
    }

    const availBefore = this.inventory.available;
    const resBefore = this.inventory.reserved;

    this.inventory.available += res.quantity;
    this.inventory.reserved -= res.quantity;
    res.status = 'RELEASED';

    this.recordTransaction(
      'RELEASE',
      res,
      `Released ${res.quantity} units back to stock (Available: ${availBefore} -> ${this.inventory.available}, Reserved: ${resBefore} -> ${this.inventory.reserved})`
    );

    this.assertInvariants();
    this.notify();
    return true;
  }

  /**
   * Set reservation to PAYMENT_PENDING when payment processing begins
   * Status: RESERVED -> PAYMENT_PENDING
   */
  public markPaymentPending(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res) return false;
    if (res.status !== 'RESERVED') return false;

    res.status = 'PAYMENT_PENDING';
    this.recordTransaction(
      'RESERVE_SUCCESS',
      res,
      `Payment authorization started for reservation ${res.id} (holding locked stock)`
    );
    this.assertInvariants();
    this.notify();
    return true;
  }

  /**
   * Confirm reservation into completed purchase
   * Status: RESERVED / PAYMENT_PENDING -> CONFIRMED
   * Inventory: reserved -= quantity; sold += quantity
   */
  public confirmReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res) return false;

    if (res.status !== 'RESERVED' && res.status !== 'PAYMENT_PENDING') {
      return false;
    }

    const resBefore = this.inventory.reserved;
    const soldBefore = this.inventory.sold;

    this.inventory.reserved -= res.quantity;
    this.inventory.sold += res.quantity;
    res.status = 'CONFIRMED';

    this.recordTransaction(
      'CONFIRM',
      res,
      `Confirmed purchase of ${res.quantity} units (Reserved: ${resBefore} -> ${this.inventory.reserved}, Sold: ${soldBefore} -> ${this.inventory.sold})`
    );

    this.assertInvariants();
    this.notify();
    return true;
  }

  /**
   * Expire reservation
   * Status: RESERVED / PAYMENT_PENDING -> EXPIRED
   * Inventory: available += quantity; reserved -= quantity
   */
  public expireReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res) return false;

    if (res.status !== 'RESERVED' && res.status !== 'PAYMENT_PENDING') {
      return false;
    }

    const availBefore = this.inventory.available;
    const resBefore = this.inventory.reserved;

    this.inventory.available += res.quantity;
    this.inventory.reserved -= res.quantity;
    res.status = 'EXPIRED';

    this.recordTransaction(
      'EXPIRE',
      res,
      `TTL expired: Reclaimed ${res.quantity} units (Available: ${availBefore} -> ${this.inventory.available}, Reserved: ${resBefore} -> ${this.inventory.reserved})`
    );

    this.assertInvariants();
    this.notify();
    return true;
  }

  /**
   * Periodic local timer scanner for expired TTLs
   */
  public checkExpirations(): void {
    const now = Date.now();
    let changed = false;

    for (const res of this.reservations.values()) {
      if (res.status === 'RESERVED' && now >= res.expiresAt) {
        const availBefore = this.inventory.available;
        this.inventory.available += res.quantity;
        this.inventory.reserved -= res.quantity;
        res.status = 'EXPIRED';

        this.recordTransaction(
          'EXPIRE',
          res,
          `Auto TTL Expiry: Reclaimed ${res.quantity} units (Available: ${availBefore} -> ${this.inventory.available})`
        );
        changed = true;
      }
    }

    if (changed) {
      this.assertInvariants();
      this.notify();
    }
  }

  private startExpiryTimer(): void {
    if (typeof window !== 'undefined') {
      this.timerInterval = window.setInterval(() => {
        this.checkExpirations();
      }, 1000);
    }
  }

  public resetStore(): void {
    this.inventory = { ...INITIAL_PRODUCT_INVENTORY };
    this.reservations.clear();
    this.idempotencyIndex.clear();
    this.transactions = [];
    this.recordTransaction('RESET', {
      id: 'SYS-RESET',
      customerId: 'SYSTEM',
      productId: this.inventory.productId,
      quantity: 0,
      status: 'RELEASED',
      createdAt: Date.now(),
      expiresAt: Date.now(),
      idempotencyKey: 'SYS-RESET',
    }, 'Inventory store reset to baseline (100 total, 100 available)');
    this.assertInvariants();
    this.notify();
  }

  private recordTransaction(
    type: InventoryTransaction['type'],
    res: Reservation,
    details: string
  ): void {
    const tx: InventoryTransaction = {
      id: `TX-${String(this.txCounter++).padStart(4, '0')}`,
      timestamp: Date.now(),
      type,
      reservationId: res.id,
      customerId: res.customerId,
      quantity: res.quantity,
      status: res.status,
      availableBefore: this.inventory.available,
      availableAfter: this.inventory.available,
      reservedBefore: this.inventory.reserved,
      reservedAfter: this.inventory.reserved,
      soldBefore: this.inventory.sold,
      soldAfter: this.inventory.sold,
      details,
    };
    this.transactions.push(tx);
    if (this.transactions.length > 100) {
      this.transactions.shift();
    }
  }

  /**
   * Seed mock initial transactions/reservations for clean UI display
   */
  public seedMockData(): void {
    if (this.reservations.size > 0) return;

    // Seed a couple of realistic demo reservations to showcase the UI immediately
    this.reserveInventory({
      customerId: 'usr_alpha_101',
      quantity: 2,
      idempotencyKey: 'idem_key_001',
      ttlSeconds: 180,
    });

    const res2 = this.reserveInventory({
      customerId: 'usr_beta_204',
      quantity: 3,
      idempotencyKey: 'idem_key_002',
      ttlSeconds: 240,
    });
    if (res2.success) {
      this.confirmReservation(res2.reservation.id);
    }

    const res3 = this.reserveInventory({
      customerId: 'usr_gamma_309',
      quantity: 1,
      idempotencyKey: 'idem_key_003',
      ttlSeconds: 1,
    });
    if (res3.success) {
      this.expireReservation(res3.reservation.id);
    }

    const res4 = this.reserveInventory({
      customerId: 'usr_delta_412',
      quantity: 2,
      idempotencyKey: 'idem_key_004',
      ttlSeconds: 60,
    });
    if (res4.success) {
      this.releaseReservation(res4.reservation.id);
    }
  }
  /**
   * Dedicated high-performance atomic batch processor for the 10,000 concurrency simulation.
   * Processes each request through the atomic inventory barrier and idempotency index.
   */
  public processSimulatedBatch(requests: import('../types').SimulatedPurchaseRequest[]): {
    results: {
      request: import('../types').SimulatedPurchaseRequest;
      success: boolean;
      isOutOfStock: boolean;
      isIdempotent: boolean;
      message: string;
    }[];
    inventory: ProductInventory;
  } {
    const results: {
      request: import('../types').SimulatedPurchaseRequest;
      success: boolean;
      isOutOfStock: boolean;
      isIdempotent: boolean;
      message: string;
    }[] = [];

    const now = Date.now();
    const ttlSeconds = 300; // 5 min TTL

    for (const req of requests) {
      const idempotencyId = `${req.customerId.trim().toLowerCase()}:${req.idempotencyKey.trim()}`;
      const existingResId = this.idempotencyIndex.get(idempotencyId);

      // 1. Idempotency Check
      if (existingResId) {
        const existingRes = this.reservations.get(existingResId);
        if (existingRes) {
          results.push({
            request: req,
            success: existingRes.status === 'RESERVED' || existingRes.status === 'CONFIRMED',
            isOutOfStock: false,
            isIdempotent: true,
            message: `Replayed existing key without duplicate stock reduction`,
          });
          continue;
        }
      }

      // 2. Atomic Inventory Availability Check
      if (this.inventory.available >= req.quantity && req.quantity > 0) {
        // Atomic decrement
        this.inventory.available -= req.quantity;
        this.inventory.reserved += req.quantity;

        const newReservation: Reservation = {
          id: req.requestId,
          customerId: req.customerId,
          productId: req.productId,
          quantity: req.quantity,
          status: 'RESERVED',
          createdAt: now,
          expiresAt: now + ttlSeconds * 1000,
          idempotencyKey: req.idempotencyKey,
        };

        this.reservations.set(req.requestId, newReservation);
        this.idempotencyIndex.set(idempotencyId, req.requestId);

        results.push({
          request: req,
          success: true,
          isOutOfStock: false,
          isIdempotent: false,
          message: `Reservation successful (${this.inventory.available} remaining)`,
        });
      } else {
        // Out of stock or invalid
        const isOutOfStock = this.inventory.available === 0;
        const failedRes: Reservation = {
          id: req.requestId,
          customerId: req.customerId,
          productId: req.productId,
          quantity: req.quantity,
          status: 'FAILED',
          createdAt: now,
          expiresAt: now,
          idempotencyKey: req.idempotencyKey,
          failureReason: isOutOfStock ? 'Out of stock' : 'Insufficient stock',
        };

        this.reservations.set(req.requestId, failedRes);
        this.idempotencyIndex.set(idempotencyId, req.requestId);

        results.push({
          request: req,
          success: false,
          isOutOfStock,
          isIdempotent: false,
          message: isOutOfStock ? 'Out of stock' : 'Insufficient stock',
        });
      }
    }

    this.assertInvariants();
    this.notify();

    return {
      results,
      inventory: { ...this.inventory },
    };
  }

  public resetForSimulation(): void {
    this.inventory = {
      productId: 'fg-ltd-01',
      productName: 'FlashGuard Limited Product',
      total: 100,
      available: 100,
      reserved: 0,
      sold: 0,
    };
    this.reservations.clear();
    this.idempotencyIndex.clear();
    this.transactions = [];
    this.assertInvariants();
    this.notify();
  }
}

// Export singleton instance
export const reservationService = new ReservationService();
// Initialize mock data
reservationService.seedMockData();

