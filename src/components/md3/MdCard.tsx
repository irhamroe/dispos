import React from 'react';

export interface MdCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined' | 'tonal';
  radius?: 'default' | 'large' | 'xl';
  hoverable?: boolean;
}

export const MdCard: React.FC<MdCardProps> = ({
  children,
  variant = 'filled',
  radius = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  const radiusClasses = {
    default: 'rounded-[24px]',
    large: 'rounded-[32px]',
    xl: 'rounded-[40px]',
  }[radius];

  const variantClasses = {
    filled: 'bg-[#F3EDF7] text-[#1C1B1F] border-0',
    elevated: 'bg-[#F3EDF7] text-[#1C1B1F] shadow-sm',
    tonal: 'bg-[#E8DEF8] text-[#1D192B] border-0',
    outlined: 'bg-[#FFFBFE] text-[#1C1B1F] border border-[#79747E]/30 shadow-none',
  }[variant];

  const hoverClasses = hoverable
    ? 'transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:shadow-md hover:scale-[1.01] hover:bg-[#EFE7F3]'
    : 'transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]';

  return (
    <div
      className={`relative overflow-hidden p-6 ${radiusClasses} ${variantClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
