import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 50"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Modern Typing Icon - Keyboard keys with motion effect */}
      <g>
        {/* Background glow effect */}
        <ellipse cx="28" cy="22" rx="30" ry="8" fill="hsl(var(--primary))" opacity="0.1" />
        
        {/* Keyboard keys - modern design with depth */}
        <rect x="4" y="14" width="16" height="16" rx="3" fill="hsl(var(--primary))" opacity="1" />
        <rect x="4" y="14" width="16" height="8" rx="3" fill="hsl(var(--primary))" opacity="0.6" />
        
        <rect x="24" y="14" width="16" height="16" rx="3" fill="hsl(var(--primary))" opacity="0.9" />
        <rect x="24" y="14" width="16" height="8" rx="3" fill="hsl(var(--primary))" opacity="0.5" />
        
        <rect x="44" y="14" width="16" height="16" rx="3" fill="hsl(var(--primary))" opacity="0.8" />
        <rect x="44" y="14" width="16" height="8" rx="3" fill="hsl(var(--primary))" opacity="0.4" />
        
        {/* Motion trail lines */}
        <line x1="0" y1="22" x2="4" y2="22" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
        <line x1="20" y1="22" x2="24" y2="22" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
        <line x1="40" y1="22" x2="44" y2="22" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
        <line x1="60" y1="22" x2="72" y2="22" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
        
        {/* Speed arrow - modern and bold */}
        <path
          d="M 70 22 L 80 22 M 77 19 L 80 22 L 77 25"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      
      {/* TypingThrust Text - Clean and modern */}
      <text
        x="88"
        y="32"
        fontSize="23"
        fontWeight="700"
        fill="hsl(var(--foreground))"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="-0.4"
      >
        TypingThrust
      </text>
    </svg>
  );
};

export default Logo;

