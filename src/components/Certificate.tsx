// @ts-ignore
import React from 'react';

interface CertificateProps {
  name: string;
  wpm: number;
  accuracy: number;
  email: string;
  date?: string;
}

function generateCertificateId(name: string, date: string) {
  // Simple hash for uniqueness
  return (
    'TT-' +
    btoa(name + date)
      .replace(/[^A-Z0-9]/gi, '')
      .slice(0, 8)
      .toUpperCase()
  );
}

const Certificate: React.FC<CertificateProps> = ({ name, wpm, accuracy, email, date }) => {
  const issueDate = date || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const certId = generateCertificateId(name, issueDate);

  // Truncate long names to prevent overflow
  const displayName = name.length > 40 ? name.substring(0, 37) + '...' : name;
  // Truncate long emails to prevent overflow
  const displayEmail = email.length > 35 ? email.substring(0, 32) + '...' : email;

  return (
    <div
      className="w-[800px] h-[600px] bg-white relative"
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
      id="certificate-download-area"
    >
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-gray-800 to-black" />
      
      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col" style={{ minHeight: 0 }}>
        {/* Header section - minimal */}
        <div className="pt-12 px-16 pb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium whitespace-nowrap">
              TypingThrust
            </div>
            <div className="text-xs text-gray-400 font-mono whitespace-nowrap">
              {certId}
            </div>
          </div>
          
          {/* Main title */}
          <div className="text-center mb-2">
            <h1 className="text-5xl font-light tracking-tight text-black mb-1" style={{ letterSpacing: '-0.02em', lineHeight: '1.1' }}>
              Certificate
            </h1>
            <div className="w-16 h-px bg-black mx-auto mt-3" />
          </div>
        </div>

        {/* Body content - flexible middle section */}
        <div className="flex-1 px-16 flex flex-col justify-center" style={{ minHeight: 0, overflow: 'hidden' }}>
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 leading-relaxed mb-4 max-w-lg mx-auto">
              This certifies that
            </p>
            
            {/* Name - prominent but elegant with proper overflow handling */}
            <div className="mb-6 px-4">
              <h2 
                className="text-4xl font-light text-black tracking-tight mx-auto" 
                style={{ 
                  letterSpacing: '-0.01em',
                  lineHeight: '1.2',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}
              >
                {displayName}
              </h2>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-8 max-w-lg mx-auto px-4">
              has achieved a typing speed of <span className="font-semibold text-black">{wpm} WPM</span> with <span className="font-semibold text-black">{accuracy}%</span> accuracy.
            </p>
          </div>

          {/* Stats - minimal grid */}
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mb-8">
            <div className="text-center">
              <div className="text-5xl font-light text-black mb-1" style={{ letterSpacing: '-0.03em', lineHeight: '1' }}>
                {wpm}
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mt-1">
                Words Per Minute
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light text-black mb-1" style={{ letterSpacing: '-0.03em', lineHeight: '1' }}>
                {accuracy}%
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mt-1">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Footer - minimal */}
        <div className="px-16 pb-12 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-200 pt-6">
            <div className="font-mono whitespace-nowrap" style={{ maxWidth: '45%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {issueDate}
            </div>
            <div className="text-gray-300 whitespace-nowrap" style={{ maxWidth: '45%', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
              {displayEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-gray-800 to-black" />
    </div>
  );
};

export default Certificate;