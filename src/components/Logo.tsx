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
          {/* Background circle/badge */}
          <circle cx="24" cy="24" r="22" fill="hsl(var(--primary))" opacity="0.15" />
          <circle cx="24" cy="24" r="22" stroke="hsl(var(--primary))" strokeWidth="2" />
          
          {/* Keyboard icon */}
          <rect x="12" y="18" width="24" height="14" rx="2" fill="hsl(var(--primary))" opacity="0.25" />
          <rect x="12" y="18" width="24" height="14" rx="2" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          
          {/* Keys */}
          <rect x="15" y="21" width="5" height="5" rx="1" fill="hsl(var(--primary))" />
          <rect x="22" y="21" width="5" height="5" rx="1" fill="hsl(var(--primary))" opacity="0.7" />
          <rect x="29" y="21" width="5" height="5" rx="1" fill="hsl(var(--primary))" opacity="0.5" />
          
          {/* Speed lines */}
          <path
            d="M 36 25 L 40 25 M 38 23 L 40 25 L 38 27"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
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

