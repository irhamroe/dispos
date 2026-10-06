import React from 'react';

export interface MdButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  icon?: React.ReactNode;
}

export const MdButton: React.FC<MdButtonProps> = ({
  children,
  variant = 'filled',
  size = 'default',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs font-medium gap-1.5',
    default: 'h-10 px-6 text-sm font-medium gap-2',
    lg: 'h-12 px-8 text-base font-medium gap-2.5',
    icon: 'h-10 w-10 p-0 items-center justify-center',
  }[size];

  const variantClasses = {
    filled:
      'bg-[#6750A4] text-white hover:bg-[#6750A4]/90 shadow-none hover:shadow-md active:bg-[#6750A4]/80',
    tonal:
      'bg-[#E8DEF8] text-[#1D192B] hover:bg-[#DFD3F3] active:bg-[#D4C4EC] shadow-none hover:shadow-sm',
    outlined:
      'border border-[#79747E] bg-transparent text-[#6750A4] hover:bg-[#6750A4]/10 active:bg-[#6750A4]/15',
    text:
      'bg-transparent text-[#6750A4] hover:bg-[#6750A4]/10 active:bg-[#6750A4]/15 shadow-none',
    danger:
      'bg-[#BA1A1A] text-white hover:bg-[#BA1A1A]/90 active:bg-[#93000A] shadow-none hover:shadow-md',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full font-roboto transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
