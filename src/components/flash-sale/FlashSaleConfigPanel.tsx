import React from 'react';
import type { FlashSaleConfig, FlashSaleStatus, SimulationSpeed } from '../../types';
import { Play, Pause, RotateCcw, Package, Clock, Users, Gauge, Sparkles } from 'lucide-react';

interface FlashSaleConfigPanelProps {
  config: FlashSaleConfig;
  status: FlashSaleStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
}

export const FlashSaleConfigPanel: React.FC<FlashSaleConfigPanelProps> = ({
  config,
  status,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
}) => {
  const speeds: SimulationSpeed[] = ['Slow', 'Normal', 'Fast', 'Instant'];

  return (
    <div className="flash-config-panel">
      <div className="flash-config-header">
        <div className="flash-config-title">
          <Sparkles size={16} className="text-cyan" />
          <span>SIMULATION PARAMETERS</span>
        </div>
        <div className="flash-config-scenario">
          <span>Target Scenario:</span> <strong>10,000 Customers</strong> competing for{' '}
          <strong>100 Units</strong>
        </div>
      </div>

      <div className="flash-config-grid">
        {/* Product Card */}
        <div className="config-item">
          <div className="config-item-icon">
            <Package size={16} />
          </div>
          <div className="config-item-content">
            <div className="config-label">PRODUCT</div>
            <div className="config-value">{config.productName}</div>
            <div className="config-sub">SKU: FG-2026-LTD</div>
          </div>
        </div>

        {/* Total Inventory */}
        <div className="config-item">
          <div className="config-item-icon">
            <Package size={16} />
          </div>
          <div className="config-item-content">
            <div className="config-label">TOTAL INVENTORY</div>
            <div className="config-value font-mono">{config.totalInventory} units</div>
            <div className="config-sub">Strict ceiling cap</div>
          </div>
        </div>

        {/* Reservation Duration */}
        <div className="config-item">
          <div className="config-item-icon">
            <Clock size={16} />
          </div>
          <div className="config-item-content">
            <div className="config-label">RESERVATION DURATION</div>
            <div className="config-value font-mono">5 minutes</div>
            <div className="config-sub">TTL countdown lock</div>
          </div>
        </div>

        {/* Concurrent Users */}
        <div className="config-item">
          <div className="config-item-icon">
            <Users size={16} />
          </div>
          <div className="config-item-content">
            <div className="config-label">CONCURRENT USERS</div>
            <div className="config-value font-mono text-cyan">10,000</div>
            <div className="config-sub">Simulated client burst</div>
          </div>
        </div>
      </div>

      {/* Speed & Actions Bar */}
      <div className="flash-controls-bar">
        <div className="speed-selector">
          <div className="speed-label">
            <Gauge size={14} />
            <span>Simulation Speed:</span>
          </div>
          <div className="speed-pills">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                className={`speed-pill ${config.simulationSpeed === s ? 'active' : ''}`}
                onClick={() => onSpeedChange(s)}
                disabled={status === 'RUNNING'}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          {status === 'RUNNING' ? (
            <button type="button" className="btn btn-warning" onClick={onPause}>
              <Pause size={15} />
              <span>PAUSE SIMULATION</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStart}
              disabled={status === 'COMPLETED'}
            >
              <Play size={15} fill="currentColor" />
              <span>
                {status === 'PAUSED' ? 'RESUME SIMULATION' : 'START FLASH SALE'}
              </span>
            </button>
          )}

          <button type="button" className="btn btn-secondary" onClick={onReset}>
            <RotateCcw size={15} />
            <span>RESET SIMULATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
