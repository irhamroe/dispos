import React from 'react';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'pink' | 'emerald' | 'sky' | 'amber' | 'white' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ClayButton: React.FC<ClayButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-10 px-4 text-xs rounded-[16px] gap-1.5',
    md: 'h-12 px-5 text-sm rounded-[20px] gap-2',
    lg: 'h-14 px-7 text-base rounded-[22px] gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-br from-[#9333EA] via-[#7C3AED] to-[#6D28D9] text-white shadow-clay-button hover:shadow-clay-button-hover hover:from-[#A855F7] hover:to-[#7C3AED]',
    pink:
      'bg-gradient-to-br from-[#F472B6] via-[#EC4899] to-[#DB2777] text-white shadow-clay-button hover:shadow-clay-button-hover',
    emerald:
      'bg-gradient-to-br from-[#34D399] via-[#10B981] to-[#059669] text-white shadow-clay-button hover:shadow-clay-button-hover',
    sky:
      'bg-gradient-to-br from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-clay-button hover:shadow-clay-button-hover',
    amber:
      'bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-white shadow-clay-button hover:shadow-clay-button-hover',
    danger:
      'bg-gradient-to-br from-[#F87171] via-[#EF4444] to-[#DC2626] text-white shadow-clay-button hover:shadow-clay-button-hover',
    white:
      'bg-white text-[#332F3A] shadow-clay-button-white hover:bg-slate-50',
    ghost:
      'bg-transparent text-[#4C4459] hover:bg-purple-100/60 hover:text-purple-900',
  };

  const baseStyles =
    'inline-flex items-center justify-center font-bold font-nunito tracking-wide transition-all duration-200 cursor-pointer select-none active:scale-[0.93] active:shadow-clay-pressed disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 hover:-translate-y-0.5';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
