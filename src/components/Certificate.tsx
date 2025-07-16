// @ts-ignore
import React from 'react';
import QRCode from 'react-qr-code';

// Add Pacifico font for the name
const pacificoFontUrl = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap';

interface CertificateProps {
  name: string;
  wpm: number;
  accuracy: number;
  email: string;
  date?: string;
}

function generateCertificateId(name: string, date: string) {
  // Simple hash for uniqueness (not cryptographically secure)
  return (
    'THRUST-' +
    btoa(name + date)
      .replace(/[^A-Z0-9]/gi, '')
      .slice(0, 10)
      .toUpperCase()
  );
}

const Certificate: React.FC<CertificateProps> = ({ name, wpm, accuracy, email, date }) => {
  // Inject Pacifico font
  React.useEffect(() => {
    if (!document.getElementById('pacifico-font')) {
      const link = document.createElement('link');
      link.id = 'pacifico-font';
      link.rel = 'stylesheet';
      link.href = pacificoFontUrl;
      document.head.appendChild(link);
    }
  }, []);

  const issueDate = date || new Date().toLocaleDateString();
  const certId = generateCertificateId(name, issueDate);
  const qrValue = `https://typingthrust.com/verify?cert=${certId}`;
  const logo = '/public/logo.png'; // Use your provided logo

  return (
    <div
      className="w-[820px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden relative font-sans flex flex-col justify-between"
      style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif', position: 'relative', boxShadow: '0 8px 40px 0 rgba(25, 118, 210, 0.10)' }}
      id="certificate-download-area"
    >
      {/* Top Bar with Logo */}
      <div className="flex flex-row justify-between items-start px-12 pt-10 pb-2">
        <div></div>
        <img src={logo} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px #eee)' }} />
      </div>
      {/* Certificate Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-12 pt-0 pb-0 relative z-10">
        <div className="text-2xl font-bold text-gray-800 mb-1 mt-2 tracking-wide" style={{ letterSpacing: 1 }}>Certificate</div>
        <div className="text-lg font-semibold text-gray-500 mb-2">of Appreciation</div>
        <div className="text-base text-gray-600 mb-6 text-center max-w-2xl">
          In recognition of your outstanding typing performance, we proudly award this Certificate of Appreciation in Typing to
        </div>
        {/* Name in Pacifico font */}
        <div className="mb-2" style={{ fontFamily: 'Pacifico, cursive', fontSize: '2.5rem', color: '#1a237e', fontWeight: 400 }}>{name}</div>
        <div className="text-base text-gray-700 mb-4 text-center max-w-xl">
          for achieving a typing speed of <b>{wpm} WPM</b> with <b>{accuracy}% accuracy</b>.<br />
          <span className="text-gray-500">Email:</span> <span className="text-gray-800 font-semibold">{email}</span>
        </div>
        {/* Details Row */}
        <div className="flex flex-row gap-16 mb-4 mt-2">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-gray-900">{wpm}</span>
            <span className="text-base text-gray-500 font-semibold">WPM</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-gray-900">{accuracy}%</span>
            <span className="text-base text-gray-500 font-semibold">Accuracy</span>
          </div>
        </div>
        {/* QR Code */}
        <div style={{ position: 'absolute', left: 48, bottom: 110, width: 70, height: 70, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #bdbdbd', boxShadow: '0 2px 8px #eee' }}>
          <QRCode value={qrValue} size={56} fgColor="#1976d2" bgColor="#fff" />
        </div>
      </div>
      {/* Blue Footer Bar */}
      <div className="w-full bg-[#1976d2] text-white flex flex-row items-center justify-between px-12 py-3 text-base font-semibold" style={{ letterSpacing: 1, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <span>ISSUING DATE: {issueDate}</span>
        <span>CERTIFICATE NO: {certId}</span>
      </div>
    </div>
  );
};

export default Certificate; 