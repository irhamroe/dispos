import React from 'react';

export const ClayBackgroundBlobs: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 select-none">
      {/* Top-Left Violet / Purple Orb */}
      <div 
        className="absolute -top-[12%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br from-[#A78BFA]/20 via-[#7C3AED]/15 to-transparent blur-3xl animate-clay-float"
      />
      {/* Top-Right Hot Pink Orb */}
      <div 
        className="absolute top-[5%] -right-[12%] w-[50vw] h-[50vw] max-w-[580px] max-h-[580px] rounded-full bg-gradient-to-br from-[#F472B6]/20 via-[#DB2777]/15 to-transparent blur-3xl animate-clay-float-delayed"
      />
      {/* Center-Bottom Sky Blue Orb */}
      <div 
        className="absolute -bottom-[15%] left-[20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-[#38BDF8]/20 via-[#0EA5E9]/15 to-transparent blur-3xl animate-clay-float-slow"
      />
      {/* Mid-Right Emerald Green / Amber Subtle Orb */}
      <div 
        className="absolute top-[45%] -left-[15%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-tr from-[#34D399]/15 via-[#FBBF24]/10 to-transparent blur-3xl animate-clay-float-delayed"
      />
    </div>
  );
};
