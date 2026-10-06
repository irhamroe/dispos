import React from 'react';

interface ClaySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ClaySelect = React.forwardRef<HTMLSelectElement, ClaySelectProps>(
  ({ label, icon, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-[#4C4459] font-nunito tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-purple-600/70 pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`w-full bg-[#EAE4F5] border-0 text-[#332F3A] font-bold text-xs sm:text-sm rounded-[18px] shadow-clay-pressed py-3 transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-purple-400/25 focus:outline-none cursor-pointer appearance-none ${
              icon ? 'pl-10 pr-9' : 'px-4 pr-9'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-purple-500/70 flex items-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

ClaySelect.displayName = 'ClaySelect';
