import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-slate-100 mb-2 text-center">Privacy Policy</h1>
      <p className="text-slate-400 mb-8 text-center text-sm">Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <div className="space-y-6 text-slate-300">
        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">1. Introduction</h2>
          <p className="leading-relaxed text-sm">
            At TypingThrust, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and protect your personal data when you use our services.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">2. Information We Collect</h2>
          <p className="leading-relaxed text-sm mb-2">
            We collect information you provide directly, including:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm ml-4 text-slate-400">
            <li>Email address and account credentials</li>
            <li>Typing test results and performance statistics</li>
            <li>User preferences and settings</li>
          </ul>
          <p className="leading-relaxed text-sm mt-3">
            We may also collect data from third-party authentication providers (Google, GitHub) and anonymized usage data for analytics purposes.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">3. How We Use Your Information</h2>
          <p className="leading-relaxed text-sm">
            Your data helps us personalize your experience, improve typing performance tracking, provide insights via analytics, and enhance our services. We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">4. Cookies and Tracking</h2>
          <p className="leading-relaxed text-sm">
            TypingThrust uses cookies and similar technologies to maintain sessions, remember your preferences, and improve your site experience. You may disable cookies in your browser settings, but certain features may not work properly.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">5. Data Sharing</h2>
          <p className="leading-relaxed text-sm">
            We never sell your data. Data may be shared only with secure third-party services required for functionality (e.g., authentication providers, hosting services). All data sharing is done in compliance with applicable privacy laws.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">6. Data Security</h2>
          <p className="leading-relaxed text-sm">
            We implement industry-standard security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">7. Your Rights</h2>
          <p className="leading-relaxed text-sm mb-2">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm ml-4 text-slate-400">
            <li>Access your personal data</li>
            <li>Modify or update your information</li>
            <li>Delete your account and data</li>
            <li>Opt-out of certain data collection</li>
          </ul>
          <p className="leading-relaxed text-sm mt-3">
            Contact us anytime for assistance with these requests.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">8. Children's Privacy</h2>
          <p className="leading-relaxed text-sm">
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">9. Changes to This Policy</h2>
          <p className="leading-relaxed text-sm">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">10. Contact Us</h2>
          <p className="leading-relaxed text-sm">
            For privacy-related questions or concerns, please contact us at:{' '}
            <a href="mailto:support@typingthrust.com" className="text-blue-600 hover:text-blue-800 underline">
              support@typingthrust.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}