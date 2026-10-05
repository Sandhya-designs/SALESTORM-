import React from 'react';
import type { InventorySafetyChecks } from '../../types';
import { ShieldCheck, Check, AlertTriangle } from 'lucide-react';

interface InventorySafetyValidationPanelProps {
  checks: InventorySafetyChecks;
}

export const InventorySafetyValidationPanel: React.FC<InventorySafetyValidationPanelProps> = ({
  checks,
}) => {
  const checkItems = [
    {
      id: 'res-under-limit',
      label: 'Successful reservations <= total inventory',
      detail: 'Successful count strictly <= 100 units',
      passed: checks.reservationsUnderLimit,
    },
    {
      id: 'available-non-negative',
      label: 'Available inventory >= 0',
      detail: 'Stock level never breaches floor bound',
      passed: checks.availableNonNegative,
    },
    {
      id: 'no-duplicate-keys',
      label: 'No duplicate idempotency keys',
      detail: 'Idempotency filter guarantees exactly-once processing',
      passed: checks.noDuplicateKeys,
    },
    {
      id: 'no-overselling',
      label: 'No overselling',
      detail: 'Oversold units strictly equal to 0',
      passed: checks.noOverselling,
    },
    {
      id: 'conservation-invariant',
      label: 'Reserved + available + sold = total',
      detail: 'Strict mathematical conservation law holds at all times',
      passed: checks.conservationInvariant,
    },
  ];

  const allPassed = checkItems.every((item) => item.passed);

  return (
    <div className="safety-validation-card">
      <div className="safety-validation-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} className="text-emerald" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
            INVENTORY SAFETY CHECKS (TEST MODE)
          </span>
        </div>
        <div>
          {allPassed ? (
            <span className="badge badge-emerald">ALL 5 INVARIANTS PASSING</span>
          ) : (
            <span className="badge badge-danger">INVARIANT BREACH DETECTED</span>
          )}
        </div>
      </div>

      <div className="safety-checks-grid">
        {checkItems.map((item) => (
          <div
            key={item.id}
            className={`safety-check-row ${item.passed ? 'check-passed' : 'check-failed'}`}
          >
            <div className={`check-icon-circle ${item.passed ? 'circle-pass' : 'circle-fail'}`}>
              {item.passed ? (
                <Check size={15} strokeWidth={2.8} />
              ) : (
                <AlertTriangle size={15} strokeWidth={2.5} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="check-label font-mono">
                {item.passed ? '✓ ' : '✗ '}
                {item.label}
              </div>
              <div className="check-detail">{item.detail}</div>
            </div>
            <span className={`status-pill ${item.passed ? 'pill-pass font-mono' : 'pill-fail font-mono'}`}>
              {item.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
