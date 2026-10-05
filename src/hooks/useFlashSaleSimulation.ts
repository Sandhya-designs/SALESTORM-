import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  FlashSaleConfig,
  FlashSaleStatus,
  FlashSaleMetrics,
  ActivityLog,
  SimulationTrafficSample,
  SimulationSpeed,
} from '../types';

const INITIAL_CONFIG: FlashSaleConfig = {
  productName: 'Limited Edition Product',
  totalInventory: 100,
  reservationDurationSec: 300, // 5 minutes
  concurrentUsers: 10000,
  simulationSpeed: 'Normal',
};

const INITIAL_METRICS: FlashSaleMetrics = {
  requestsReceived: 0,
  successfulReservations: 0,
  failedReservations: 0,
  availableStock: 100,
  activeReservations: 0,
  paymentsPending: 0,
  ordersConfirmed: 0,
  progressPercent: 0,
};

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '00:00:01',
    message: 'Flash sale initialized',
    type: 'info',
  },
  {
    id: 'log-2',
    timestamp: '00:00:02',
    message: 'Inventory loaded: 100 units',
    type: 'success',
  },
  {
    id: 'log-3',
    timestamp: '00:00:03',
    message: 'System ready for incoming traffic (Target: 10,000 users)',
    type: 'info',
  },
];

const INITIAL_SAMPLES: SimulationTrafficSample[] = [
  {
    id: 'req-init-1',
    userId: 'usr_sys_check',
    timestamp: '00:00:01',
    stage: 'Rate Limiter',
    result: 'SUCCESS',
    latencyMs: 1.2,
  },
];

export function useFlashSaleSimulation() {
  const [config, setConfig] = useState<FlashSaleConfig>(INITIAL_CONFIG);
  const [status, setStatus] = useState<FlashSaleStatus>('SALE READY');
  const [metrics, setMetrics] = useState<FlashSaleMetrics>(INITIAL_METRICS);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [trafficSamples, setTrafficSamples] = useState<SimulationTrafficSample[]>(INITIAL_SAMPLES);

  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const logCounterRef = useRef<number>(4);

  const getSpeedInterval = (speed: SimulationSpeed) => {
    switch (speed) {
      case 'Slow':
        return { interval: 180, step: 0.6 };
      case 'Fast':
        return { interval: 60, step: 2.5 };
      case 'Instant':
        return { interval: 20, step: 20 };
      case 'Normal':
      default:
        return { interval: 100, step: 1.2 };
    }
  };

  const addLog = useCallback((message: string, type: ActivityLog['type'] = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: ActivityLog = {
      id: `log-${logCounterRef.current++}`,
      timestamp: timeStr,
      message,
      type,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  const addTrafficSample = useCallback(
    (
      userId: string,
      stage: SimulationTrafficSample['stage'],
      result: SimulationTrafficSample['result'],
      latencyMs: number
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const sample: SimulationTrafficSample = {
        id: `req-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId,
        timestamp: timeStr,
        stage,
        result,
        latencyMs,
      };
      setTrafficSamples((prev) => [sample, ...prev.slice(0, 9)]);
    },
    []
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startSimulation = useCallback(() => {
    if (status === 'COMPLETED') {
      return;
    }

    setStatus('RUNNING');
    if (progressRef.current === 0) {
      addLog('Simulation initiated: Wave 1 traffic ingress ramping to 10,000 req/s', 'info');
      addLog('Rate limiter bucket engaged: Token bucket threshold 2,500 RPS', 'info');
    } else {
      addLog('Simulation resumed', 'info');
    }
  }, [status, addLog]);

  const pauseSimulation = useCallback(() => {
    stopTimer();
    setStatus('PAUSED');
    addLog('Simulation paused by operator', 'warning');
  }, [stopTimer, addLog]);

  const resetSimulation = useCallback(() => {
    stopTimer();
    progressRef.current = 0;
    setStatus('SALE READY');
    setMetrics(INITIAL_METRICS);
    setLogs(INITIAL_LOGS);
    setTrafficSamples(INITIAL_SAMPLES);
  }, [stopTimer]);

  const updateSpeed = useCallback((speed: SimulationSpeed) => {
    setConfig((prev) => ({ ...prev, simulationSpeed: speed }));
  }, []);

  const updateConfig = useCallback((updates: Partial<FlashSaleConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Main simulation tick loop
  useEffect(() => {
    if (status !== 'RUNNING') {
      stopTimer();
      return;
    }

    const { interval, step } = getSpeedInterval(config.simulationSpeed);

    timerRef.current = window.setInterval(() => {
      progressRef.current = Math.min(100, progressRef.current + step);
      const pct = progressRef.current;

      // Realistic model of 10,000 users competing for 100 units:
      // Requests ramp up quickly with a steep curve:
      const totalReq = Math.min(10000, Math.floor(10000 * Math.pow(pct / 100, 0.75)));

      // Reservations happen very early in the traffic burst (within first 20-30% of traffic)
      // Cap strictly at totalInventory (100)
      const targetReservations = Math.min(100, Math.floor(100 * Math.min(1, pct / 25)));
      const stock = Math.max(0, 100 - targetReservations);
      const failed = Math.max(0, totalReq - targetReservations);

      // Conversion from active reservation -> payments pending -> orders confirmed
      // As time moves forward:
      let activeRes = 0;
      let payPending = 0;
      let confirmedOrders = 0;

      if (pct < 35) {
        activeRes = targetReservations;
        payPending = 0;
        confirmedOrders = 0;
      } else if (pct < 65) {
        const ratio = (pct - 35) / 30;
        confirmedOrders = Math.floor(targetReservations * ratio * 0.5);
        payPending = Math.floor(targetReservations * 0.4);
        activeRes = Math.max(0, targetReservations - confirmedOrders - payPending);
      } else {
        const ratio = (pct - 65) / 35;
        confirmedOrders = Math.floor(targetReservations * (0.5 + ratio * 0.5));
        payPending = Math.max(0, Math.floor((targetReservations - confirmedOrders) * 0.6));
        activeRes = Math.max(0, targetReservations - confirmedOrders - payPending);
      }

      // At 100%, finalize confirmed orders to 100
      if (pct >= 100) {
        confirmedOrders = 100;
        activeRes = 0;
        payPending = 0;
      }

      setMetrics({
        requestsReceived: totalReq,
        successfulReservations: targetReservations,
        failedReservations: failed,
        availableStock: stock,
        activeReservations: activeRes,
        paymentsPending: payPending,
        ordersConfirmed: confirmedOrders,
        progressPercent: Math.round(pct),
      });

      // Milestone logging & traffic generation
      const randomUserId = `usr_${Math.floor(1000 + Math.random() * 9000)}`;

      if (pct >= 10 && pct < 12 && totalReq > 500) {
        addLog(`Traffic spike: 1,500 concurrent requests entered gateway`, 'warning');
      } else if (pct >= 25 && stock === 0 && targetReservations === 100) {
        addLog(`INVENTORY EXHAUSTED: All 100 units reserved. Strict zero-oversell invariant held!`, 'alert');
      } else if (pct >= 50 && confirmedOrders >= 25) {
        addLog(`Payment processor: 25 reservations converted to confirmed orders`, 'success');
      } else if (pct >= 75 && confirmedOrders >= 75) {
        addLog(`High commitment rate: 75/100 confirmed orders processed idempotently`, 'success');
      }

      // Generate live traffic sample
      if (Math.random() > 0.4) {
        if (stock > 0 && targetReservations < 100 && Math.random() > 0.6) {
          addTrafficSample(randomUserId, 'Reservation', 'RESERVED', +(Math.random() * 4 + 1).toFixed(1));
        } else if (stock === 0) {
          addTrafficSample(
            randomUserId,
            'Inventory Decision',
            'SOLD_OUT',
            +(Math.random() * 3 + 0.8).toFixed(1)
          );
        } else {
          addTrafficSample(
            randomUserId,
            'Rate Limiter',
            'RATE_LIMITED',
            +(Math.random() * 2 + 0.5).toFixed(1)
          );
        }
      }

      if (pct >= 100) {
        stopTimer();
        setStatus('COMPLETED');
        addLog(`FLASH SALE FINISHED: 10,000 requests processed. Exactly 100 orders confirmed. Overselling = 0.`, 'success');
      }
    }, interval);

    return () => {
      stopTimer();
    };
  }, [status, config.simulationSpeed, stopTimer, addLog, addTrafficSample]);

  return {
    config,
    status,
    metrics,
    logs,
    trafficSamples,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateSpeed,
    updateConfig,
  };
}
