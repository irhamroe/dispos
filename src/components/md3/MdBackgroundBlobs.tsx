import React from 'react';

export const MdBackgroundBlobs: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 bg-[#FFFBFE]" aria-hidden="true">
      {/* Seed Purple / Violet Ambient Shape */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[65vh] h-[65vh] rounded-full bg-[#6750A4]/12 blur-3xl animate-md-drift-1" 
      />
      {/* Secondary Lavender Ambient Shape */}
      <div 
        className="absolute top-[35%] -right-[12%] w-[60vh] h-[60vh] rounded-full bg-[#E8DEF8]/50 blur-3xl animate-md-drift-2" 
      />
      {/* Tertiary Dusty Rose / Mauve Accent Shape */}
      <div 
        className="absolute -bottom-[15%] left-[20%] w-[55vh] h-[55vh] rounded-full bg-[#7D5260]/10 blur-3xl animate-md-drift-1" 
      />
      {/* Subtle Radial Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(232,222,248,0.3)_0%,_transparent_50%)]" />
    </div>
  );
};
