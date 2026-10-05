import React from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  rightAction,
  children,
}) => {
  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            {icon && <span>{icon}</span>}
            {title}
          </h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
      {children}
    </div>
  );
};
