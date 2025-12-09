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
  const displayEmail = email.length > 40 ? email.substring(0, 37) + '...' : email;

  return (
    <div
      className="bg-white relative"
      style={{ 
        width: '800px',
        height: '600px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
      id="certificate-download-area"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-black" />
      
      {/* Main content container with proper padding */}
      <div 
        className="relative z-10 flex flex-col"
        style={{ 
          padding: '48px 64px 72px 64px',
          boxSizing: 'border-box',
          minHeight: '100%',
          height: '600px',
          justifyContent: 'space-between'
        }}
      >
        {/* Header section */}
        <div className="flex-shrink-0 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-xs tracking-[0.15em] uppercase text-gray-500 font-medium">
              TypingThrust
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {certId}
            </div>
          </div>
          
          {/* Main title */}
          <div className="text-center">
            <h1 className="text-4xl font-light text-black mb-2" style={{ letterSpacing: '-0.01em', lineHeight: '1.1' }}>
              Certificate of Achievement
            </h1>
            <div className="w-20 h-px bg-black mx-auto" />
          </div>
        </div>

        {/* Body content - flexible middle section */}
        <div className="flex-1 flex flex-col justify-center" style={{ minHeight: 0, flex: '1 1 auto' }}>
          <div className="text-center mb-10">
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              This certifies that
            </p>
            
            {/* Name */}
            <div className="mb-8 px-4">
              <h2 
                className="text-3xl font-light text-black mx-auto" 
                style={{ 
                  letterSpacing: '-0.01em',
                  lineHeight: '1.3',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}
              >
                {displayName}
              </h2>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-10 max-w-lg mx-auto px-4">
              has achieved a typing speed of <span className="font-semibold text-black">{wpm} WPM</span> with <span className="font-semibold text-black">{accuracy}%</span> accuracy.
            </p>
          </div>

          {/* Stats - vertical layout to prevent overlap */}
          <div className="flex justify-center gap-16 mb-8">
            <div className="text-center" style={{ minWidth: '120px' }}>
              <div className="text-4xl font-light text-black mb-2" style={{ letterSpacing: '-0.02em', lineHeight: '1' }}>
                {wpm}
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                WPM
              </div>
            </div>
            <div className="text-center" style={{ minWidth: '120px' }}>
              <div className="text-4xl font-light text-black mb-2" style={{ letterSpacing: '-0.02em', lineHeight: '1' }}>
                {accuracy}%
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Footer - ensure it's not cut off */}
        <div className="flex-shrink-0 mt-auto" style={{ paddingTop: '20px', marginBottom: '0', minHeight: '60px' }}>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200" style={{ paddingTop: '12px', paddingBottom: '4px' }}>
            <div 
              className="font-mono" 
              style={{ 
                maxWidth: '48%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '12px',
                lineHeight: '1.5'
              }}
            >
              {issueDate}
            </div>
            <div 
              className="text-gray-500" 
              style={{ 
                maxWidth: '48%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                paddingLeft: '12px',
                lineHeight: '1.5'
              }}
            >
              {displayEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line - positioned inside to avoid cutoff */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" style={{ zIndex: 20 }} />
    </div>
  );
};

export default Certificate;
