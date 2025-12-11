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
          {/* Professional keyboard icon */}
          <g>
            {/* Main keyboard shape */}
            <rect x="6" y="12" width="36" height="24" rx="5" fill="hsl(var(--primary))" opacity="0.1" />
            <rect x="6" y="12" width="36" height="24" rx="5" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            
            {/* Key rows - clean design */}
            <rect x="11" y="17" width="8" height="7" rx="1.5" fill="hsl(var(--primary))" />
            <rect x="21" y="17" width="8" height="7" rx="1.5" fill="hsl(var(--primary))" opacity="0.8" />
            <rect x="31" y="17" width="7" height="7" rx="1.5" fill="hsl(var(--primary))" opacity="0.6" />
            
            <rect x="11" y="26" width="8" height="7" rx="1.5" fill="hsl(var(--primary))" opacity="0.7" />
            <rect x="21" y="26" width="8" height="7" rx="1.5" fill="hsl(var(--primary))" opacity="0.5" />
            <rect x="31" y="26" width="7" height="7" rx="1.5" fill="hsl(var(--primary))" opacity="0.4" />
            
            {/* Speed indicator */}
            <path
              d="M 40 24 L 46 24 M 43 21.5 L 46 24 L 43 26.5"
              stroke="hsl(var(--primary))"
              strokeWidth="3.5"
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

