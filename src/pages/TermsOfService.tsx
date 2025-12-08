import React from 'react';

export default function TermsOfService() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-slate-100 mb-2 text-center">Terms of Service</h1>
      <p className="text-slate-400 mb-8 text-center text-sm">Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <div className="space-y-6 text-slate-300">
        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">1. Acceptance of Terms</h2>
          <p className="leading-relaxed text-sm">
            By accessing and using TypingThrust, you agree to abide by these Terms of Service and all applicable laws and regulations. If you disagree with any part of these terms, please discontinue use of our services.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">2. Use of Services</h2>
          <p className="leading-relaxed text-sm mb-2">
            TypingThrust is a platform for testing and improving your typing skills. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm ml-4 text-slate-400">
            <li>Use the platform only for lawful purposes</li>
            <li>Not misuse or attempt to interfere with platform functionality</li>
            <li>Not attempt to gain unauthorized access to any part of the service</li>
            <li>Not use automated systems to manipulate test results</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">3. User Accounts</h2>
          <p className="leading-relaxed text-sm">
            You are responsible for maintaining the security of your account credentials. Do not share login information or attempt to impersonate another user. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">4. Intellectual Property</h2>
          <p className="leading-relaxed text-sm">
            All content and materials on TypingThrust, including the logo, tests, UI design, performance data, and software, are owned by TypingThrust or its licensors. Unauthorized use, reproduction, or distribution is prohibited.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">5. User Content</h2>
          <p className="leading-relaxed text-sm">
            You retain ownership of any content you submit to TypingThrust. By submitting content, you grant us a license to use, display, and distribute that content in connection with our services.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">6. Prohibited Activities</h2>
          <p className="leading-relaxed text-sm mb-2">
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm ml-4 text-slate-400">
            <li>Use the service for any illegal purpose</li>
            <li>Attempt to hack, disrupt, or damage the service</li>
            <li>Use automated tools to manipulate typing test results</li>
            <li>Impersonate others or provide false information</li>
            <li>Spam or harass other users</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">7. Termination</h2>
          <p className="leading-relaxed text-sm">
            TypingThrust reserves the right to suspend or terminate accounts that violate these terms without prior notice. You may also terminate your account at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">8. Disclaimers</h2>
          <p className="leading-relaxed text-sm">
            TypingThrust is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or secure. Your use of the service is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">9. Limitation of Liability</h2>
          <p className="leading-relaxed text-sm">
            To the maximum extent permitted by law, TypingThrust shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">10. Changes to Terms</h2>
          <p className="leading-relaxed text-sm">
            We may update these Terms of Service periodically. Continued use of the site after changes implies acceptance of the updated terms. We will notify users of significant changes via email or site notification.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">11. Governing Law</h2>
          <p className="leading-relaxed text-sm">
            These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-slate-100 mb-3">12. Contact Us</h2>
          <p className="leading-relaxed text-sm">
            For questions regarding these Terms of Service, please contact us at:{' '}
            <a href="mailto:support@typingthrust.com" className="text-blue-600 hover:text-blue-800 underline">
              support@typingthrust.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}