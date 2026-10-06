import React from 'react';

interface ClayInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const ClayInput = React.forwardRef<HTMLInputElement, ClayInputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => {
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
          <input
            ref={ref}
            className={`w-full bg-[#EAE4F5] border-0 text-[#332F3A] font-medium text-sm rounded-[18px] shadow-clay-pressed py-3 transition-all duration-200 placeholder:text-[#8E869B] focus:bg-white focus:ring-4 focus:ring-purple-400/25 focus:outline-none ${
              icon ? 'pl-10 pr-4' : 'px-4'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-bold text-rose-600 pl-1">{error}</p>}
      </div>
    );
  }
);

ClayInput.displayName = 'ClayInput';
