import React from 'react';

interface CertificateProps {
  name: string;
  wpm: number;
  accuracy: number;
  email: string;
  date?: string;
}

function generateCertificateId(name: string, date: string) {
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
    month: 'numeric', 
    day: 'numeric' 
  });
  const certId = generateCertificateId(name, issueDate);

  return (
    <div
      id="certificate-download-area"
      style={{ 
        width: '1123px', // A4 landscape at 96 DPI: 297mm = 1123px
        height: '794px',  // A4 landscape at 96 DPI: 210mm = 794px
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none'
      }}
    >
      {/* Modern gradient accent bars */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          zIndex: 10
        }}
      />
      
      {/* Main content with maximum safe padding to prevent cutoff */}
      <div 
        style={{ 
          padding: '50px 70px 120px 70px', // Maximum bottom padding (120px) to ensure footer is never cut off
          boxSizing: 'border-box',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
          overflow: 'visible' // Allow content to be visible
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '50px'
          }}>
            <div style={{ 
              fontSize: '11px', 
              letterSpacing: '0.2em', 
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              TypingThrust
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#9ca3af',
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}>
              {certId}
            </div>
          </div>
          
          {/* Modern title */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '42px', 
              fontWeight: '300',
              color: '#111827',
              margin: '0 0 12px 0',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              Certificate of Achievement
            </h1>
            <div style={{ 
              width: '60px', 
              height: '2px', 
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              margin: '0 auto'
            }} />
          </div>
        </div>

        {/* Main content - centered with reduced padding to make room for footer */}
        <div style={{ 
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '30px 0 20px 0', // Reduced padding to make room for footer
          minHeight: 0,
          overflow: 'visible'
        }}>
          <p style={{ 
            fontSize: '15px', 
            color: '#6b7280',
            margin: '0 0 32px 0',
            fontWeight: '400'
          }}>
            This certifies that
          </p>
          
          {/* Name - modern styling */}
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '400',
            color: '#111827',
            margin: '0 0 40px 0',
            letterSpacing: '-0.01em',
            lineHeight: '1.3',
            maxWidth: '900px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            padding: '0 20px'
          }}>
            {email || name}
          </h2>
          
          <p style={{ 
            fontSize: '16px', 
            color: '#4b5563',
            margin: '0 0 60px 0',
            lineHeight: '1.6',
            maxWidth: '700px',
            padding: '0 20px'
          }}>
            has achieved a typing speed of <strong style={{ color: '#111827', fontWeight: '600' }}>{wpm} WPM</strong> with <strong style={{ color: '#111827', fontWeight: '600' }}>{accuracy}%</strong> accuracy.
          </p>

          {/* Stats - modern card design */}
          <div style={{ 
            display: 'flex', 
            gap: '80px',
            marginTop: '20px',
            marginBottom: '20px' // Add bottom margin
          }}>
            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div style={{ 
                fontSize: '56px', 
                fontWeight: '300',
                color: '#111827',
                margin: '0 0 8px 0',
                letterSpacing: '-0.03em',
                lineHeight: '1'
              }}>
                {wpm}
              </div>
              <div style={{ 
                fontSize: '11px', 
                letterSpacing: '0.15em',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: '500'
              }}>
                WPM
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div style={{ 
                fontSize: '56px', 
                fontWeight: '300',
                color: '#111827',
                margin: '0 0 8px 0',
                letterSpacing: '-0.03em',
                lineHeight: '1'
              }}>
                {accuracy}%
              </div>
              <div style={{ 
                fontSize: '11px', 
                letterSpacing: '0.15em',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: '500'
              }}>
                ACCURACY
              </div>
            </div>
          </div>
        </div>

        {/* Footer - fixed at bottom with maximum safe padding to prevent cutoff */}
        <div style={{ 
          marginTop: 'auto',
          paddingTop: '18px',
          paddingBottom: '25px', // Maximum bottom padding to prevent cutoff
          borderTop: '1px solid #e5e7eb',
          minHeight: '90px', // Increased min height to ensure space
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          flexShrink: 0,
          position: 'relative',
          zIndex: 5,
          overflow: 'visible' // Ensure footer content is visible
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: '#9ca3af',
            paddingTop: '6px',
            paddingBottom: '8px', // Extra bottom padding for text
            width: '100%',
            lineHeight: '1.6',
            minHeight: '35px', // Ensure minimum height for text visibility
            overflow: 'visible' // Make sure text is not clipped
          }}>
            <div style={{ 
              fontFamily: 'monospace',
              maxWidth: '48%',
              overflow: 'visible',
              textOverflow: 'clip',
              whiteSpace: 'nowrap',
              paddingRight: '12px',
              lineHeight: '1.6',
              height: 'auto'
            }}>
              {issueDate}
            </div>
            <div style={{ 
              maxWidth: '48%',
              overflow: 'visible',
              textOverflow: 'clip',
              whiteSpace: 'nowrap',
              textAlign: 'right',
              paddingLeft: '12px',
              lineHeight: '1.6',
              height: 'auto'
            }}>
              {email}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent - positioned at very bottom */}
      <div 
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '4px',
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          zIndex: 3
        }}
      />
    </div>
  );
};

export default Certificate;
