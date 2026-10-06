import React from 'react';

interface ClayBadgeProps {
  variant?: 'violet' | 'pink' | 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const ClayBadge: React.FC<ClayBadgeProps> = ({
  variant = 'violet',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[10px] rounded-full gap-1',
    md: 'px-3 py-1 text-xs rounded-full gap-1.5',
  };

  const variantStyles = {
    violet: 'bg-purple-100 text-purple-900 border border-purple-200/80 shadow-clay-pill',
    pink: 'bg-pink-100 text-pink-900 border border-pink-200/80 shadow-clay-pill',
    emerald: 'bg-emerald-100 text-emerald-950 border border-emerald-200/80 shadow-clay-pill',
    sky: 'bg-sky-100 text-sky-950 border border-sky-200/80 shadow-clay-pill',
    amber: 'bg-amber-100 text-amber-950 border border-amber-200/80 shadow-clay-pill',
    rose: 'bg-rose-100 text-rose-950 border border-rose-200/80 shadow-clay-pill',
    slate: 'bg-slate-100 text-slate-800 border border-slate-200/80 shadow-clay-pill',
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-nunito tracking-wide select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
