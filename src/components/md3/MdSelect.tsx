import React from 'react';

export interface MdSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
}

export const MdSelect = React.forwardRef<HTMLSelectElement, MdSelectProps>(
  ({ label, error, helperText, startIcon, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full font-roboto">
        {label && (
          <label className="block text-xs font-medium text-[#49454F] mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 text-[#49454F] pointer-events-none">
              {startIcon}
            </div>
          )}
          <select
            ref={ref}
            className={`w-full bg-[#E7E0EC] text-[#1C1B1F] rounded-t-xl rounded-b-none border-b-2 border-[#79747E] px-4 py-3 text-sm appearance-none transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus:outline-hidden focus:border-[#6750A4] focus:bg-[#EDE7F2] cursor-pointer ${
              startIcon ? 'pl-10' : ''
            } pr-10 ${
              error ? 'border-b-[#BA1A1A] focus:border-b-[#BA1A1A]' : ''
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 pointer-events-none text-[#49454F]">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[#BA1A1A] ml-1">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#49454F] ml-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

MdSelect.displayName = 'MdSelect';
