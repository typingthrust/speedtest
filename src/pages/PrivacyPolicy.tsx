import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans" style={{ fontFamily: 'Inter, SF Pro, system-ui, sans-serif' }}>
      {/* Header Bar */}
      <div className="w-full bg-gray-100/80 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-black text-base font-medium bg-white/70 rounded-lg px-3 py-1 shadow-sm border border-gray-200">
            <span className="text-xl">←</span>
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="w-20" /> {/* Spacer for symmetry */}
        </div>
      </div>
      {/* Main Card */}
      <main className="w-full bg-white rounded-2xl shadow-lg px-4 md:px-12 py-10 mt-8 mb-8 flex flex-col gap-6 border border-gray-100 max-w-none">
        <h1 className="text-3xl font-extrabold text-[#181818] mb-2 text-center">Privacy Policy</h1>
        <p className="text-gray-700 mb-4 text-center font-medium">Effective Date: July 16, 2025</p>
        <div className="divide-y divide-gray-200">
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">1. Introduction</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">At TypingThrust, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and protect your personal data when you use our services.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">2. Information We Collect</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">We collect information you provide directly (e.g., email, typing stats), and data from third-party logins (Google, GitHub if used). We may also collect anonymized usage data for analytics purposes.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">3. How We Use Your Information</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">Your data helps us personalize your experience, improve typing performance tracking, and provide insights via analytics.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">4. Cookies</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">TypingThrust uses cookies to maintain sessions and improve your site experience. You may disable cookies, but certain features may not work properly.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">5. Data Sharing</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">We never sell your data. Data may be shared only with secure third-party services required for functionality (e.g., authentication, analytics).</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">6. Your Rights</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">You have the right to access, modify, or delete your personal data. Contact us anytime for assistance.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">7. Contact Us</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">For privacy-related questions, contact: <a href="mailto:support@typingthrust.com" className="underline">support@typingthrust.com</a></p>
          </section>
        </div>
      </main>
    </div>
  );
} 