import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  className = '',
  size = 18,
  style,
}) => {
  const IconComponent = (
    Icons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
    >
  )[name];

  if (!IconComponent) {
    const Fallback = Icons.HelpCircle;
    return <Fallback className={className} size={size} style={style} />;
  }

  return <IconComponent className={className} size={size} style={style} />;
};
