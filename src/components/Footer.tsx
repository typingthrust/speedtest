import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-background text-foreground/80 mt-auto border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:items-center">
          {/* Links and Copyright */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
              <Link
                to="/privacy-policy"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none whitespace-nowrap"
              >
                Terms
              </Link>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none whitespace-nowrap"
              >
                Contact
              </Link>
            </div>
            
            {/* Copyright */}
            <p className="text-muted-foreground text-sm whitespace-nowrap">
              © {new Date().getFullYear()} TypingThrust
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;