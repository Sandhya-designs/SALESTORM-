import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/orderService';
import type { OrderRecord, OrderStatus } from '../types';

export function useOrderStore() {
  const [orders, setOrders] = useState<OrderRecord[]>(orderService.getOrders());

  const sync = useCallback(() => {
    setOrders(orderService.getOrders());
  }, []);

  useEffect(() => {
    const unsubscribe = orderService.subscribe(sync);
    return () => {
      unsubscribe();
    };
  }, [sync]);

  const transitionOrder = useCallback(
    (orderId: string, nextStatus: OrderStatus, note?: string) => {
      const res = orderService.transitionOrder(orderId, nextStatus, note);
      sync();
      return res;
    },
    [sync]
  );

  const createDemoTraceFlow = useCallback(() => {
    const res = orderService.createDemoTraceFlow();
    sync();
    return res;
  }, [sync]);

  const resetOrders = useCallback(() => {
    orderService.resetOrders();
    sync();
  }, [sync]);

  return {
    orders,
    transitionOrder,
    createDemoTraceFlow,
    resetOrders,
  };
}
