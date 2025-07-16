import React from 'react';
import { Link } from 'react-router-dom';

const pages = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Contact', to: '/contact' },
];

const Footer = () => (
  <nav
    style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 50 }}
    className="flex flex-wrap gap-4 text-sm px-6 py-2 bg-gray-900/90 rounded-full shadow-lg text-gray-100"
  >
    {pages.map((page) => (
      <Link key={page.to} to={page.to} className="hover:text-white transition-colors duration-150">
        {page.label}
      </Link>
    ))}
  </nav>
);

export default Footer; 