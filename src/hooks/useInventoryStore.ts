import { useState, useEffect, useCallback } from 'react';
import { reservationService } from '../services/reservationService';
import type {
  ProductInventory,
  Reservation,
  ReserveRequest,
  ReserveResult,
  InventoryTransaction,
} from '../types';

export function useInventoryStore() {
  const [inventory, setInventory] = useState<ProductInventory>(
    reservationService.getInventory()
  );
  const [reservations, setReservations] = useState<Reservation[]>(
    reservationService.getReservations()
  );
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(
    reservationService.getTransactions()
  );

  const sync = useCallback(() => {
    setInventory(reservationService.getInventory());
    setReservations(reservationService.getReservations());
    setTransactions(reservationService.getTransactions());
  }, []);

  useEffect(() => {
    const unsubscribe = reservationService.subscribe(sync);
    return () => {
      unsubscribe();
    };
  }, [sync]);

  const reserveInventory = useCallback(
    (req: ReserveRequest): ReserveResult => {
      const res = reservationService.reserveInventory(req);
      sync();
      return res;
    },
    [sync]
  );

  const releaseReservation = useCallback(
    (reservationId: string): boolean => {
      const res = reservationService.releaseReservation(reservationId);
      sync();
      return res;
    },
    [sync]
  );

  const confirmReservation = useCallback(
    (reservationId: string): boolean => {
      const res = reservationService.confirmReservation(reservationId);
      sync();
      return res;
    },
    [sync]
  );

  const expireReservation = useCallback(
    (reservationId: string): boolean => {
      const res = reservationService.expireReservation(reservationId);
      sync();
      return res;
    },
    [sync]
  );

  const resetStore = useCallback(() => {
    reservationService.resetStore();
    sync();
  }, [sync]);

  const isInvariantValid =
    inventory.available + inventory.reserved + inventory.sold === inventory.total &&
    inventory.available >= 0 &&
    inventory.reserved >= 0 &&
    inventory.sold <= inventory.total;

  return {
    inventory,
    reservations,
    transactions,
    isInvariantValid,
    reserveInventory,
    releaseReservation,
    confirmReservation,
    expireReservation,
    resetStore,
  };
}
