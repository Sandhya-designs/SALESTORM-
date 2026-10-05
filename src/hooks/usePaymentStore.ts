import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import type {
  PaymentRecord,
  PaymentSimulationConfig,
  SimulatePaymentRequest,
  SimulatePaymentResult,
} from '../types';

export function usePaymentStore() {
  const [payments, setPayments] = useState<PaymentRecord[]>(
    paymentService.getPayments()
  );
  const [stats, setStats] = useState(paymentService.getStats());
  const [config, setConfig] = useState<PaymentSimulationConfig>(
    paymentService.getConfig()
  );

  const sync = useCallback(() => {
    setPayments(paymentService.getPayments());
    setStats(paymentService.getStats());
    setConfig(paymentService.getConfig());
  }, []);

  useEffect(() => {
    const unsubscribe = paymentService.subscribe(sync);
    return () => {
      unsubscribe();
    };
  }, [sync]);

  const simulatePayment = useCallback(
    async (req: SimulatePaymentRequest): Promise<SimulatePaymentResult> => {
      const res = await paymentService.simulatePayment(req);
      sync();
      return res;
    },
    [sync]
  );

  const reconcilePayment = useCallback(
    (paymentId: string, resolution: 'SUCCESS' | 'FAILED'): boolean => {
      const res = paymentService.reconcilePayment(paymentId, resolution);
      sync();
      return res;
    },
    [sync]
  );

  const updateConfig = useCallback(
    (newConfig: Partial<PaymentSimulationConfig>) => {
      paymentService.updateConfig(newConfig);
      sync();
    },
    [sync]
  );

  const resetPayments = useCallback(() => {
    paymentService.resetPayments();
    sync();
  }, [sync]);

  return {
    payments,
    stats,
    config,
    simulatePayment,
    reconcilePayment,
    updateConfig,
    resetPayments,
  };
}
