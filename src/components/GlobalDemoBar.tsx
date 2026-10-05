import React, { useState, useEffect } from 'react';
import { globalDemoService } from '../services/globalDemoService';
import {
  Play,
  RotateCcw,
  AlertTriangle,
  Zap,
  ServerCrash,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const GlobalDemoBar: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState(() => globalDemoService.isDemoMode());
  const [lastActionMsg, setLastActionMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = globalDemoService.subscribe(() => {
      setIsDemoMode(globalDemoService.isDemoMode());
    });
    return unsubscribe;
  }, []);

  const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
    try {
      setIsProcessing(true);
      const res = await actionFn();
      if (typeof res === 'string') {
        setLastActionMsg(`${actionName}: ${res}`);
      } else if (res && typeof res.processed === 'number') {
        setLastActionMsg(`${actionName}: Processed ${res.processed} requests -> ${res.successful} reserved, ${res.oversold} oversold!`);
      } else {
        setLastActionMsg(`${actionName}: Executed successfully.`);
      }
    } catch (err: any) {
      setLastActionMsg(`${actionName} Error: ${err.message || 'Failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    globalDemoService.resetSimulation();
    setLastActionMsg('System completely restored to baseline: Inventory=100, Reservations=0, Payments=0, Orders=0, Failures=0, Metrics=reset.');
  };

  if (!isDemoMode) {
    return (
      <div className="demo-bar-docked" style={{ padding: '6px 24px', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          className="btn-link font-mono"
          onClick={() => globalDemoService.toggleDemoMode()}
          style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}
        >
          <Sparkles size={12} /> Enable Hackathon Demo Mode
        </button>
      </div>
    );
  }

  return (
    <div className="demo-bar-container">
      <div className="demo-bar-inner">
        {/* Left: Demo Mode Indicator & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="demo-mode-badge">
            <span className="status-dot pulse-dot" />
            <span style={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              DEMO MODE ACTIVE
            </span>
          </div>
          <button
            type="button"
            className="btn-link"
            style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
            onClick={() => globalDemoService.toggleDemoMode()}
            title="Hide quick demo toolbar"
          >
            Hide
          </button>
        </div>

        {/* Center: Quick Action Buttons */}
        <div className="demo-bar-actions">
          <button
            type="button"
            className="btn-demo-action"
            disabled={isProcessing}
            onClick={() => handleAction('Start Flash Sale', () => globalDemoService.quickStartFlashSale())}
          >
            <Play size={11} fill="currentColor" />
            <span>Start Flash Sale</span>
          </button>

          <button
            type="button"
            className="btn-demo-action"
            disabled={isProcessing}
            onClick={() => handleAction('Run 10K Simulation', () => globalDemoService.quickRun10KSimulation())}
          >
            <Zap size={11} />
            <span>Run 10K Simulation</span>
          </button>

          <button
            type="button"
            className="btn-demo-action btn-demo-warn"
            disabled={isProcessing}
            onClick={() => handleAction('Payment Failure', () => globalDemoService.quickSimulatePaymentFailure())}
          >
            <AlertTriangle size={11} />
            <span>Simulate Payment Failure</span>
          </button>

          <button
            type="button"
            className="btn-demo-action btn-demo-warn"
            disabled={isProcessing}
            onClick={() => handleAction('Order Failure', () => globalDemoService.quickSimulateOrderFailure())}
          >
            <ServerCrash size={11} />
            <span>Simulate Order Failure</span>
          </button>

          <button
            type="button"
            className="btn-demo-action"
            disabled={isProcessing}
            onClick={() => handleAction('Expire Hold', () => globalDemoService.quickExpireReservation())}
          >
            <Clock size={11} />
            <span>Expire Reservation</span>
          </button>

          {/* Reset System Button */}
          <button
            type="button"
            className="btn-demo-action btn-demo-reset"
            onClick={handleReset}
            title="Completely restore inventory=100, reservations=0, payments=0, orders=0, failures=0"
          >
            <RotateCcw size={11} />
            <span>RESET SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast / Banner */}
      {lastActionMsg && (
        <div className="demo-bar-feedback font-mono">
          <CheckCircle2 size={13} className="text-emerald" style={{ flexShrink: 0 }} />
          <span>{lastActionMsg}</span>
          <button
            type="button"
            className="btn-close"
            style={{ padding: '2px', marginLeft: 'auto' }}
            onClick={() => setLastActionMsg(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
