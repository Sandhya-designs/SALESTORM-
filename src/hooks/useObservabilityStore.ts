import { useState, useEffect } from 'react';
import { observabilityService } from '../services/observabilityService';

export function useObservabilityStore() {
  const [metrics, setMetrics] = useState(() => observabilityService.getMetrics());
  const [healthItems, setHealthItems] = useState(() => observabilityService.getServiceHealth());
  const [alerts, setAlerts] = useState(() => observabilityService.getSystemAlerts());
  const [traceSpans, setTraceSpans] = useState(() => observabilityService.getTraceSpans());
  const [chartData, setChartData] = useState(() => observabilityService.getChartData());

  useEffect(() => {
    const update = () => {
      setMetrics(observabilityService.getMetrics());
      setHealthItems(observabilityService.getServiceHealth());
      setAlerts(observabilityService.getSystemAlerts());
      setTraceSpans(observabilityService.getTraceSpans());
      setChartData(observabilityService.getChartData());
    };

    const unsubscribe = observabilityService.subscribe(update);
    // Also poll every 3 seconds for active timers/traffic simulation
    const interval = setInterval(update, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    metrics,
    healthItems,
    alerts,
    traceSpans,
    chartData,
  };
}
