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
          {/* Clean keyboard icon with speed indicator */}
          <g>
            {/* Keyboard outline */}
            <rect x="8" y="15" width="32" height="20" rx="4" fill="hsl(var(--primary))" opacity="0.08" />
            <rect x="8" y="15" width="32" height="20" rx="4" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            
            {/* Top row of keys - 3 keys */}
            <rect x="12" y="19" width="8" height="6" rx="1.5" fill="hsl(var(--primary))" />
            <rect x="22" y="19" width="8" height="6" rx="1.5" fill="hsl(var(--primary))" opacity="0.7" />
            <rect x="32" y="19" width="4" height="6" rx="1.5" fill="hsl(var(--primary))" opacity="0.5" />
            
            {/* Bottom row of keys - 3 keys */}
            <rect x="12" y="27" width="8" height="6" rx="1.5" fill="hsl(var(--primary))" opacity="0.6" />
            <rect x="22" y="27" width="8" height="6" rx="1.5" fill="hsl(var(--primary))" opacity="0.4" />
            <rect x="32" y="27" width="4" height="6" rx="1.5" fill="hsl(var(--primary))" opacity="0.3" />
            
            {/* Speed arrow pointing right */}
            <path
              d="M 38 25 L 44 25 M 41 22 L 44 25 L 41 28"
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

