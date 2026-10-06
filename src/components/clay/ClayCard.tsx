import React from 'react';

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'pressed';
  radius?: '20' | '24' | '32' | '40' | '48';
  hoverEffect?: boolean;
  className?: string;
}

export const ClayCard: React.FC<ClayCardProps> = ({
  children,
  variant = 'glass',
  radius = '32',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const radiusMap = {
    '20': 'rounded-[20px]',
    '24': 'rounded-[24px]',
    '32': 'rounded-[32px]',
    '40': 'rounded-[40px]',
    '48': 'rounded-[48px]',
  };

  const variantStyles = {
    glass: 'bg-white/75 backdrop-blur-xl border border-white/60 shadow-clay-card',
    solid: 'bg-white border border-slate-100 shadow-clay-card',
    pressed: 'bg-[#ECE7F5] border border-white/40 shadow-clay-pressed',
  };

  const hoverStyles = hoverEffect
    ? 'transition-all duration-300 hover:-translate-y-1.5 hover:shadow-clay-card-hover cursor-pointer'
    : 'transition-all duration-300';

  return (
    <div
      className={`relative overflow-hidden ${radiusMap[radius]} ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
