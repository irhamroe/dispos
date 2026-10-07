import React from 'react';

export const MdBackgroundBlobs: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 bg-[#F8FAFC] print:hidden" aria-hidden="true">
      {/* Seed Light Blue / Sky Ambient Shape */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[65vh] h-[65vh] rounded-full bg-[#0284C7]/15 blur-3xl animate-md-drift-1" 
      />
      {/* Secondary Soft Sky Tint Ambient Shape */}
      <div 
        className="absolute top-[35%] -right-[12%] w-[60vh] h-[60vh] rounded-full bg-[#BAE6FD]/40 blur-3xl animate-md-drift-2" 
      />
      {/* Tertiary Cyan / Ocean Accent Shape */}
      <div 
        className="absolute -bottom-[15%] left-[20%] w-[55vh] h-[55vh] rounded-full bg-[#0EA5E9]/12 blur-3xl animate-md-drift-1" 
      />
      {/* Subtle Radial Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(224,242,254,0.4)_0%,_transparent_50%)]" />
    </div>
  );
};
