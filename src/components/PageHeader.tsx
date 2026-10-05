import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge }) => {
  return (
    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {badge && <div>{badge}</div>}
    </div>
  );
};
