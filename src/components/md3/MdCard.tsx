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
    filled: 'bg-[#F0F9FF] text-[#0F172A] border border-[#E0F2FE]',
    elevated: 'bg-[#F0F9FF] text-[#0F172A] shadow-sm border border-[#E0F2FE]',
    tonal: 'bg-[#E0F2FE] text-[#0369A1] border-0',
    outlined: 'bg-[#F8FAFC] text-[#0F172A] border border-[#64748B]/20 shadow-none',
  }[variant];

  const hoverClasses = hoverable
    ? 'transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:shadow-md hover:scale-[1.01] hover:bg-[#E0F2FE]'
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
