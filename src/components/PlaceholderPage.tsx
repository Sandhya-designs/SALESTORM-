import React from 'react';
import { DynamicIcon } from './DynamicIcon';
import { StatusBadge } from './StatusBadge';

interface PlaceholderPageProps {
  title: string;
  iconName: string;
  phase: number;
  description: string;
  expectedFeatures: string[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  iconName,
  phase,
  description,
  expectedFeatures,
}) => {
  return (
    <div className="page-container">
      <div className="placeholder-card">
        <div className="placeholder-icon">
          <DynamicIcon name={iconName} size={32} />
        </div>
        
        <div>
          <h2 className="placeholder-title">{title} Module</h2>
          <div style={{ marginTop: '8px' }}>
            <span className="placeholder-badge">Coming in Phase {phase}</span>
          </div>
        </div>

        <p className="placeholder-desc">{description}</p>

        <div className="placeholder-spec-box">
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusBadge label={`PHASE ${phase} SPECIFICATION`} variant="dark" />
          </div>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {expectedFeatures.map((feat, idx) => (
              <li key={idx}>{feat}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
