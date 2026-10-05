import React from 'react';
import type { CoreGuarantee } from '../types';
import { Check } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface CoreGuaranteesListProps {
  guarantees: CoreGuarantee[];
}

export const CoreGuaranteesList: React.FC<CoreGuaranteesListProps> = ({ guarantees }) => {
  return (
    <div className="guarantees-grid">
      {guarantees.map((item) => (
        <div key={item.id} className="guarantee-card">
          <div className="guarantee-top">
            <div className="guarantee-check-icon">
              <Check size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="guarantee-title">
                {item.title}
                <DynamicIcon name={item.iconName} size={15} style={{ opacity: 0.7 }} />
              </div>
              <div className="guarantee-subtitle">{item.subtitle}</div>
            </div>
          </div>
          <p className="guarantee-description">{item.description}</p>
          <ul className="guarantee-bullets">
            {item.keyPoints.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
