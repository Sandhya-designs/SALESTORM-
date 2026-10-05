import React from 'react';
import type { ArchitectureStep } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { ChevronRight } from 'lucide-react';

interface ArchitectureFlowProps {
  steps: ArchitectureStep[];
}

export const ArchitectureFlow: React.FC<ArchitectureFlowProps> = ({ steps }) => {
  return (
    <div className="flow-grid">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flow-step-card">
            <div className="flow-step-header">
              <div className="flow-step-icon">
                <DynamicIcon name={step.iconName} size={15} />
              </div>
              <span className="flow-step-number">0{index + 1}</span>
            </div>
            <div className="flow-step-title">{step.title}</div>
            <div className="flow-step-subtitle">{step.subtitle}</div>
            <p className="flow-step-desc">{step.description}</p>
          </div>

          {index < steps.length - 1 && (
            <div className="flow-arrow">
              <ChevronRight size={20} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
