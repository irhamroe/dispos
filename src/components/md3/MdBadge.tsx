import React from 'react';

export interface MdBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'error' | 'surface';
  size?: 'sm' | 'md';
}

export const MdBadge: React.FC<MdBadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  }[size];

  const variantClasses = {
    primary: 'bg-[#6750A4] text-white font-medium',
    secondary: 'bg-[#E8DEF8] text-[#1D192B] font-medium',
    tertiary: 'bg-[#7D5260] text-white font-medium',
    success: 'bg-[#C8E6C9] text-[#1B5E20] font-medium',
    error: 'bg-[#FFDAD6] text-[#410002] font-medium',
    surface: 'bg-[#E7E0EC] text-[#49454F] font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-roboto transition-all duration-200 ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export interface MdChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

export const MdChip: React.FC<MdChipProps> = ({
  children,
  selected = false,
  icon,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium font-roboto transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] cursor-pointer active:scale-95 ${
        selected
          ? 'bg-[#E8DEF8] text-[#1D192B] border border-[#6750A4]/20 shadow-xs'
          : 'bg-[#FFFBFE] text-[#49454F] border border-[#79747E]/40 hover:bg-[#F3EDF7]'
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export interface MdFabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  icon?: React.ReactNode;
  label?: string;
}

export const MdFab: React.FC<MdFabProps> = ({
  variant = 'tertiary',
  icon,
  label,
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-[#6750A4] text-white hover:bg-[#6750A4]/90 shadow-md hover:shadow-lg',
    secondary: 'bg-[#E8DEF8] text-[#1D192B] hover:bg-[#DFD3F3] shadow-md hover:shadow-lg',
    tertiary: 'bg-[#7D5260] text-white hover:bg-[#7D5260]/90 shadow-md hover:shadow-lg',
    surface: 'bg-[#F3EDF7] text-[#6750A4] hover:bg-[#E8DEF8] shadow-md hover:shadow-lg',
  }[variant];

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center font-medium font-roboto transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] active:scale-95 cursor-pointer ${
        label ? 'h-14 px-6 rounded-2xl gap-3' : 'h-14 w-14 rounded-2xl'
      } ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
};
