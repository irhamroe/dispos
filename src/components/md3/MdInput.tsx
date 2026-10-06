import React from 'react';

export interface MdInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const MdInput = React.forwardRef<HTMLInputElement, MdInputProps>(
  ({ label, error, helperText, startIcon, endIcon, className = '', ...props }, ref) => {
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
          <input
            ref={ref}
            className={`w-full bg-[#E7E0EC] text-[#1C1B1F] placeholder-[#49454F]/60 rounded-t-xl rounded-b-none border-b-2 border-[#79747E] px-4 py-3 text-sm transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus:outline-hidden focus:border-[#6750A4] focus:bg-[#EDE7F2] ${
              startIcon ? 'pl-10' : ''
            } ${endIcon ? 'pr-10' : ''} ${
              error ? 'border-b-[#BA1A1A] focus:border-b-[#BA1A1A]' : ''
            } ${className}`}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 text-[#49454F]">
              {endIcon}
            </div>
          )}
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

MdInput.displayName = 'MdInput';
