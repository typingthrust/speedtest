import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import Contact from '../pages/Contact';
import { Link } from 'react-router-dom';

const logo = '/logonew.png';

const Footer = () => {
  const [open, setOpen] = useState<string | null>(null);
  
  const ModalWrapper = ({ children, scrollable = true }: { children: React.ReactNode, scrollable?: boolean }) => (
    <div className="w-full max-w-3xl mx-auto bg-slate-800 rounded-2xl shadow-xl p-0 flex flex-col items-center overflow-hidden">
      <div className="w-full flex flex-col items-center pt-8 pb-4 bg-gradient-to-b from-slate-800 to-slate-900 sticky top-0 z-10 border-b border-slate-700">
        <img src={logo} alt="TypingThrust Logo" className="h-24 md:h-28 lg:h-32 xl:h-36 mb-3 object-contain" />
      </div>
      <div className={`w-full px-6 md:px-10 py-6 ${scrollable ? 'max-h-[75vh] overflow-y-auto' : ''}`}>
        {children}
      </div>
    </div>
  );

  return (
    <footer className="w-full bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <img src={logo} alt="TypingThrust" className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 object-contain" />
          </div>
          <div className="flex items-center gap-6 text-sm">
            <button
              onClick={() => setOpen('privacy')}
              className="text-slate-400 hover:text-slate-100 transition-colors duration-200 focus:outline-none"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setOpen('terms')}
              className="text-slate-400 hover:text-slate-100 transition-colors duration-200 focus:outline-none"
            >
              Terms
            </button>
            <button
              onClick={() => setOpen('contact')}
              className="text-slate-400 hover:text-slate-100 transition-colors duration-200 focus:outline-none"
            >
              Contact
            </button>
            <p className="text-slate-500">
              © {new Date().getFullYear()} TypingThrust
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <Dialog open={open === 'privacy'} onOpenChange={v => setOpen(v ? 'privacy' : null)}>
        <DialogContent className="max-w-3xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <ModalWrapper scrollable>
            <PrivacyPolicy />
          </ModalWrapper>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={open === 'terms'} onOpenChange={v => setOpen(v ? 'terms' : null)}>
        <DialogContent className="max-w-3xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <ModalWrapper scrollable>
            <TermsOfService />
          </ModalWrapper>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={open === 'contact'} onOpenChange={v => setOpen(v ? 'contact' : null)}>
        <DialogContent className="max-w-3xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <ModalWrapper scrollable={false}>
            <Contact />
          </ModalWrapper>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;