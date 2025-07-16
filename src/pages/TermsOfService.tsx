import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
        <h1 className="text-3xl font-extrabold text-[#181818] mb-2 text-center">Terms of Service</h1>
        <p className="text-gray-700 mb-4 text-center font-medium">Effective Date: July 16, 2025</p>
        <div className="divide-y divide-gray-200">
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">1. Acceptance of Terms</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">By accessing TypingThrust, you agree to abide by these Terms of Service. If you disagree, please discontinue use.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">2. Use of Services</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">TypingThrust is a platform for testing and improving your typing skills. You agree not to misuse the platform or attempt to interfere with its functionality.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">3. User Accounts</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">You are responsible for maintaining the security of your account credentials. Do not share login information or attempt to impersonate another user.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">4. Intellectual Property</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">All content and materials on TypingThrust, including the logo, tests, UI design, and performance data, are owned by TypingThrust. Unauthorized use is prohibited.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">5. Termination</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">TypingThrust reserves the right to suspend or terminate accounts that violate these terms without notice.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">6. Changes to Terms</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">We may update these Terms periodically. Continued use of the site after changes implies acceptance.</p>
          </section>
          <section className="py-6">
            <h2 className="font-bold text-lg text-[#181818] mb-2">7. Contact Us</h2>
            <p className="text-[#1A1A1A] leading-relaxed mb-2">For questions regarding these Terms, email: <a href="mailto:support@typingthrust.com" className="underline">support@typingthrust.com</a></p>
          </section>
        </div>
      </main>
    </div>
  );
} 