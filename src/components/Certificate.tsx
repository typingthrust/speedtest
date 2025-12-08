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

  return (
    <div
      className="w-[800px] h-[600px] bg-white relative overflow-hidden"
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative'
      }}
      id="certificate-download-area"
    >
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-gray-800 to-black" />
      
      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header section - minimal */}
        <div className="pt-12 px-16 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium">
              TypingThrust
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {certId}
            </div>
          </div>
          
          {/* Main title */}
          <div className="text-center mb-2">
            <h1 className="text-5xl font-light tracking-tight text-black mb-1" style={{ letterSpacing: '-0.02em' }}>
              Certificate
            </h1>
            <div className="w-16 h-px bg-black mx-auto mt-3" />
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 px-16 flex flex-col justify-center">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-lg mx-auto">
              This certifies that
            </p>
            
            {/* Name - prominent but elegant */}
            <div className="mb-8">
              <h2 className="text-4xl font-light text-black tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                {name}
              </h2>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-10 max-w-lg mx-auto">
              has achieved a typing speed of <span className="font-semibold text-black">{wpm} WPM</span> with <span className="font-semibold text-black">{accuracy}%</span> accuracy.
            </p>
          </div>

          {/* Stats - minimal grid */}
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mb-10">
            <div className="text-center">
              <div className="text-5xl font-light text-black mb-1" style={{ letterSpacing: '-0.03em' }}>
                {wpm}
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Words Per Minute
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light text-black mb-1" style={{ letterSpacing: '-0.03em' }}>
                {accuracy}%
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Footer - minimal */}
        <div className="px-16 pb-12">
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-200 pt-6">
            <div className="font-mono">
              {issueDate}
            </div>
            <div className="text-gray-300">
              {email}
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