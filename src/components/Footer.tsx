import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import Contact from '../pages/Contact';
import logo from '../../public/logo.png';

const Footer = () => {
  const [open, setOpen] = useState<string | null>(null);
  const ModalWrapper = ({ children, scrollable = true }: { children: React.ReactNode, scrollable?: boolean }) => (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-0 flex flex-col items-center overflow-hidden">
      <div className="w-full flex flex-col items-center pt-8 pb-2 bg-white sticky top-0 z-10">
        <img src={logo} alt="TypingThrust Logo" className="h-12 md:h-16 mb-2" />
      </div>
      <div className={`w-full px-4 md:px-8 py-2 ${scrollable ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
        {children}
      </div>
    </div>
  );
  return (
    <footer className="w-full flex justify-center items-center gap-6 text-sm py-6">
      <button
        className="text-gray-700 hover:text-black transition-colors duration-150 focus:outline-none"
        style={{ textDecoration: 'none' }}
        onClick={() => setOpen('privacy')}
      >
        Privacy Policy
      </button>
      <button
        className="text-gray-700 hover:text-black transition-colors duration-150 focus:outline-none"
        style={{ textDecoration: 'none' }}
        onClick={() => setOpen('terms')}
      >
        Terms of Service
      </button>
      <button
        className="text-gray-700 hover:text-black transition-colors duration-150 focus:outline-none"
        style={{ textDecoration: 'none' }}
        onClick={() => setOpen('contact')}
      >
        Contact
      </button>
      {/* Privacy Policy Modal */}
      <Dialog open={open === 'privacy'} onOpenChange={v => setOpen(v ? 'privacy' : null)}>
        <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <ModalWrapper scrollable>
            <PrivacyPolicy />
          </ModalWrapper>
        </DialogContent>
      </Dialog>
      {/* Terms of Service Modal */}
      <Dialog open={open === 'terms'} onOpenChange={v => setOpen(v ? 'terms' : null)}>
        <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <ModalWrapper scrollable>
            <TermsOfService />
          </ModalWrapper>
        </DialogContent>
      </Dialog>
      {/* Contact Modal */}
      <Dialog open={open === 'contact'} onOpenChange={v => setOpen(v ? 'contact' : null)}>
        <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <ModalWrapper scrollable={false}>
            <Contact />
          </ModalWrapper>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer; 