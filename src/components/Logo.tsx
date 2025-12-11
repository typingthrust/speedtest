import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Mark */}
      <div className="relative flex-shrink-0">
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clear keyboard/typing icon */}
          <g>
            {/* Keyboard base - clearly recognizable */}
            <rect x="4" y="10" width="40" height="28" rx="4" fill="hsl(var(--primary))" opacity="0.08" />
            <rect x="4" y="10" width="40" height="28" rx="4" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            
            {/* Top row - QWERTY pattern */}
            <rect x="8" y="15" width="6" height="6" rx="1" fill="hsl(var(--primary))" />
            <rect x="16" y="15" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.85" />
            <rect x="24" y="15" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.7" />
            <rect x="32" y="15" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.55" />
            
            {/* Middle row */}
            <rect x="8" y="23" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.75" />
            <rect x="16" y="23" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.6" />
            <rect x="24" y="23" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.45" />
            <rect x="32" y="23" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.35" />
            
            {/* Bottom row - space bar area */}
            <rect x="8" y="31" width="20" height="4" rx="1" fill="hsl(var(--primary))" opacity="0.5" />
            
            {/* Speed/thrust indicator - motion lines and arrow */}
            <path
              d="M 40 19 L 44 19 M 40 24 L 44 24 M 40 29 L 44 29"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 44 24 L 48 24 M 46 21.5 L 48 24 L 46 26.5"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </svg>
      </div>
      
      {/* Wordmark */}
      <span className="text-xl sm:text-2xl md:text-2xl font-bold text-foreground tracking-tight select-none">
        Typing<span className="text-primary">Thrust</span>
      </span>
    </div>
  );
};

export default Logo;

